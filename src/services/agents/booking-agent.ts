import type { Json } from '@/lib/database.types';
import { computeBookingTotalCents } from '@/lib/booking-pricing';
import {
  createDevSkippedPaymentIntentId,
  isStripeBookingTestMode,
  isStripePaymentsSkipped,
} from '@/lib/booking-payments';
import { callLlmWithBackoff, generateStructuredJson, llmFlashModel } from '@/lib/llm';
import { confirmBookingWithoutPayment } from '@/lib/post-payment';
import { getOrCreateStripeCustomerForMentee } from '@/lib/stripe-customer';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { MatchingOutput, ServiceType } from '@/lib/types';

export class BookingAgent {
  private agentId = 'APX-01' as const;

  /**
   * Orchestrates the scheduling and initiates manual-capture checkout.
   */
  async bookSession(params: {
    menteeId: string;
    mentorId?: string; // If undefined, triggers Gemini matching loop
    serviceType: ServiceType;
    scheduledAt: string;
    menteeGoals: string;
    menteeBackground: string;
    includePreCallBrief?: boolean;
  }) {
    // 1. Audit Log: BOOKING_INITIATED
    await this.logAudit('BOOKING_INITIATED', null, { params });

    let finalMentorId = params.mentorId;
    let matchReason = 'User selected mentor directly.';

    // 2. Matching Engine (if no mentor selected)
    if (!finalMentorId) {
      const matchResult = await this.matchMentor({
        menteeId: params.menteeId,
        menteeGoals: params.menteeGoals,
        menteeBackground: params.menteeBackground,
        serviceType: params.serviceType,
      });
      finalMentorId = matchResult.mentor_id;
      matchReason = matchResult.match_reason;
    }

    if (!finalMentorId) {
      throw new Error('No mentor could be matched for this session.');
    }

    const { data: mentor, error: mentorErr } = await supabaseAdmin
      .from('mentors')
      .select('stripe_connect_account_id, live_session_price_cents, is_listed, compliance_status')
      .eq('id', finalMentorId)
      .single();

    if (mentorErr || !mentor) {
      throw new Error('Expert lookup failed.');
    }

    if (mentor.compliance_status !== 'approved' || !mentor.is_listed) {
      throw new Error('This expert is not available for booking.');
    }

    const includePreCallBrief = Boolean(params.includePreCallBrief);
    const servicePriceCents = computeBookingTotalCents({
      serviceType: params.serviceType,
      liveSessionPriceCents: mentor.live_session_price_cents,
      includePreCallBrief,
    });

    const skipPayments = isStripePaymentsSkipped();
    const testMode = isStripeBookingTestMode();
    const connectAccountId = mentor.stripe_connect_account_id;

    if (!skipPayments && !connectAccountId && !testMode) {
      const message =
        process.env.NODE_ENV === 'production'
          ? 'This expert has not finished payout setup yet. Please try another expert.'
          : 'This expert has not finished Stripe payouts setup yet. Set STRIPE_BOOKING_TEST_MODE=true for local checkout without Connect.';
      throw new Error(message);
    }

    let paymentIntentId: string;
    let stripeClientSecret: string | null = null;

    if (skipPayments) {
      paymentIntentId = createDevSkippedPaymentIntentId();
    } else {
      const platformFee = Math.round(servicePriceCents * 0.2);
      const stripeCustomerId = await getOrCreateStripeCustomerForMentee(params.menteeId);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: servicePriceCents,
        currency: 'usd',
        payment_method_types: ['card'],
        capture_method: 'manual',
        ...(stripeCustomerId ? { customer: stripeCustomerId } : {}),
        ...(connectAccountId && !testMode
          ? {
              application_fee_amount: platformFee,
              transfer_data: { destination: connectAccountId },
            }
          : {}),
        metadata: {
          mentor_id: finalMentorId,
          mentee_id: params.menteeId,
          service_type: params.serviceType,
        },
      });

      paymentIntentId = paymentIntent.id;
      stripeClientSecret = paymentIntent.client_secret;
    }

    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .insert({
        mentee_id: params.menteeId,
        mentor_id: finalMentorId,
        service_type: params.serviceType,
        include_pre_call_brief: includePreCallBrief,
        status: 'pending_payment',
        scheduled_at: params.scheduledAt,
        stripe_payment_intent_id: paymentIntentId,
        match_reason: params.menteeGoals || matchReason,
        intake_background: params.menteeBackground || null,
      })
      .select()
      .single();

    if (bookingErr) {
      throw new Error(`Failed to create database booking: ${bookingErr.message}`);
    }

    if (skipPayments) {
      await this.logAudit('BOOKING_CREATED', booking.id, {
        booking_id: booking.id,
        skip_payments: true,
      });

      await confirmBookingWithoutPayment(booking.id);

      return {
        bookingId: booking.id,
        stripeClientSecret: null,
        skipPayment: true,
        matchReason: params.menteeGoals || matchReason,
        amountCents: servicePriceCents,
      };
    }

    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: {
        mentor_id: finalMentorId,
        mentee_id: params.menteeId,
        service_type: params.serviceType,
        booking_id: booking.id,
      },
    });

    await this.logAudit('BOOKING_CREATED', booking.id, {
      booking_id: booking.id,
      stripe_intent_id: paymentIntentId,
    });

    return {
      bookingId: booking.id,
      stripeClientSecret,
      skipPayment: false,
      matchReason: params.menteeGoals || matchReason,
      amountCents: servicePriceCents,
    };
  }

  /**
   * Matches a mentee with the optimal mentor using the configured LLM.
   */
  private async matchMentor(input: {
    menteeId: string;
    menteeGoals: string;
    menteeBackground: string;
    serviceType: string;
  }): Promise<MatchingOutput> {
    // Retrieve mentor pool from database
    const { data: mentors } = await supabaseAdmin
      .from('mentors')
      .select('id, full_name, employer, expertise, bio')
      .eq('compliance_status', 'approved')
      .eq('is_listed', true);

    if (!mentors || mentors.length === 0) {
      throw new Error('No approved mentors available in the pool.');
    }

    const matchingSystemInstruction = `
      You are AstroLink's expert-matching engine for paid aerospace expert sessions (GLG/Minnect-style, not job placement).
      Match the buyer's goals and background to the single best expert in the pool for their booked session type.
      Strict constraints:
      - Return valid JSON matching the schema precisely.
      - Optimize for topical fit, credibility, and session value — not hiring fit or resume screening.
    `;

    const prompt = `
      Buyer goals: ${input.menteeGoals}
      Buyer background: ${input.menteeBackground}
      Session type: ${input.serviceType}

      Expert pool:
      ${JSON.stringify(mentors, null, 2)}
    `;

    const result = await callLlmWithBackoff(() =>
      generateStructuredJson<MatchingOutput>({
        model: llmFlashModel,
        rateLimitKey: input.menteeId,
        systemInstruction: matchingSystemInstruction,
        prompt,
        schema: {
          type: 'OBJECT',
          properties: {
            mentor_id: { type: 'STRING' },
            match_score: { type: 'NUMBER' },
            match_reason: { type: 'STRING' },
          },
          required: ['mentor_id', 'match_score', 'match_reason'],
        },
      }),
    );

    const mentorInPool = mentors.some((mentor) => mentor.id === result.mentor_id);
    if (!mentorInPool) {
      throw new Error('Matching engine returned an unknown expert');
    }

    return result;
  }

  private async logAudit(event: string, refId: string | null, payload: Record<string, unknown>) {
    await supabaseAdmin.from('audit_log').insert({
      agent_id: this.agentId,
      event,
      ref_id: refId,
      payload: payload as Json,
    });
  }
}
