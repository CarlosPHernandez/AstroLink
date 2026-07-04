import type { Json } from '@/lib/database.types';
import {
  CHRIS_DISCOUNT_PERCENT,
  CHRIS_ORIGINAL_PRICE_CENTS,
  CHRIS_SESSION_DURATION_MINUTES,
} from '@/lib/chris-campaign/chris-campaign-constants';
import {
  ChrisCampaignSoldOutError,
  releaseChrisCampaignSlot,
  reserveChrisCampaignSlot,
} from '@/lib/chris-campaign/chris-campaign-slots';
import { getChrisCampaignStripeDiscounts } from '@/lib/chris-campaign/chris-stripe-promo';
import { computeBookingTotalCents } from '@/lib/booking-pricing';
import {
  createDevSkippedPaymentIntentId,
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
   * Orchestrates the scheduling and creates an immediate-capture PaymentIntent.
   */
  async bookSession(params: {
    menteeId: string;
    mentorId?: string; // If undefined, triggers Gemini matching loop
    serviceType: ServiceType;
    scheduledAt: string;
    menteeGoals: string;
    menteeBackground: string;
    includePreCallBrief?: boolean;
    durationMinutes?: number; // from slider for variable 1:1; used for prorated price + persisted
    campaignId?: string;
    marketingReferrer?: string;
  }) {
    // 1. Audit Log: BOOKING_INITIATED
    await this.logAudit('BOOKING_INITIATED', null, { params });

    let campaignSlotReserved = false;
    if (params.campaignId) {
      const reserved = await reserveChrisCampaignSlot(params.campaignId);
      if (!reserved) {
        throw new ChrisCampaignSoldOutError();
      }
      campaignSlotReserved = true;
      await this.logAudit('CHRIS_CAMPAIGN_SLOT_RESERVED', null, {
        campaign_id: params.campaignId,
      });
    }

    try {
      return await this.createBookingAfterSlotReserve(params, campaignSlotReserved);
    } catch (error) {
      if (campaignSlotReserved && params.campaignId) {
        try {
          await releaseChrisCampaignSlot(params.campaignId);
          await this.logAudit('CHRIS_CAMPAIGN_SLOT_RELEASED', null, {
            campaign_id: params.campaignId,
            reason: 'booking_failed',
          });
        } catch {
          // Best-effort release; original error is more important to surface.
        }
      }
      throw error;
    }
  }

  private async createBookingAfterSlotReserve(
    params: {
      menteeId: string;
      mentorId?: string;
      serviceType: ServiceType;
      scheduledAt: string;
      menteeGoals: string;
      menteeBackground: string;
      includePreCallBrief?: boolean;
      durationMinutes?: number;
      campaignId?: string;
      marketingReferrer?: string;
    },
    _campaignSlotReserved: boolean,
  ) {
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

    // To update the base price for Stripe (before the Inspired24 discount):
    // - For normal experts: edit `live_session_price_cents` in the mentors table (Supabase).
    // - For this Chris 45-min case ($200 original): we override to CHRIS_ORIGINAL_PRICE_CENTS here.
    //   (You can also adjust the mentor price in DB, but the override ensures exactly $200 gross.)
    // - The 10% "Inspired24" discount is applied via Stripe (coupon from CHRIS_STRIPE_* env + promo code).

    const isChrisCampaign = Boolean(params.campaignId);
    const durationMinutes = isChrisCampaign
      ? CHRIS_SESSION_DURATION_MINUTES
      : params.durationMinutes;

    // Briefing (APX-02) is always included for live sessions as part of the standard offering.
    // Duration (slider) makes 1:1 price variable (prorated hourly rate from live_session_price_cents).
    const includePreCallBrief = params.serviceType === 'session_1on1';
    let servicePriceCents = computeBookingTotalCents({
      serviceType: params.serviceType,
      liveSessionPriceCents: mentor.live_session_price_cents,
      includePreCallBrief,
      durationMinutes,
    });

    // For this specific Chris case: force original gross price to $200 for the 45-min session.
    // (Overrides the prorated mentor hourly rate so the "original" before discount is exactly $200.)
    if (isChrisCampaign) {
      servicePriceCents = CHRIS_ORIGINAL_PRICE_CENTS;
    }

    // For Chris campaign, the UI shows discounted price (Inspired24 10%).
    // PI is created with gross amount + discounts; display uses net for "authorize" text.
    // For the current $1 test coupon, force display to 100 cents.
    const displayAmountCents = isChrisCampaign ? 100 : servicePriceCents;

    const skipPayments = isStripePaymentsSkipped();

    let paymentIntentId: string;
    let stripeClientSecret: string | null = null;

    if (skipPayments) {
      paymentIntentId = createDevSkippedPaymentIntentId();
    } else {
      const stripeCustomerId = await getOrCreateStripeCustomerForMentee(params.menteeId);

      const idempotencyKey = `astrolink_book_${params.menteeId}_${finalMentorId}_${params.scheduledAt}`;
      const discounts = isChrisCampaign ? await getChrisCampaignStripeDiscounts() : [];

      const paymentIntentParams: any = {
        amount: servicePriceCents,
        currency: 'usd',
        metadata: {
          app: 'astrolink',
          mentor_id: finalMentorId,
          mentee_id: params.menteeId,
          service_type: params.serviceType,
          ...(params.campaignId ? { campaign_id: params.campaignId } : {}),
          ...(params.marketingReferrer
            ? { marketing_referrer: params.marketingReferrer }
            : {}),
        },
      };

      if (stripeCustomerId) {
        paymentIntentParams.customer = stripeCustomerId;
      }

      if (discounts.length > 0) {
        paymentIntentParams.discounts = discounts;
      }

      const paymentIntent = await stripe.paymentIntents.create(
        paymentIntentParams,
        { idempotencyKey },
      );

      paymentIntentId = paymentIntent.id;
      stripeClientSecret = paymentIntent.client_secret;
    }

    const bookingInsert = {
      mentee_id: params.menteeId,
      mentor_id: finalMentorId,
      service_type: params.serviceType,
      include_pre_call_brief: includePreCallBrief,
      status: 'pending_payment' as const,
      scheduled_at: params.scheduledAt,
      stripe_payment_intent_id: paymentIntentId,
      match_reason: params.menteeGoals || matchReason,
      intake_background: params.menteeBackground || null,
      // Persist chosen duration for variable sessions (prorated price already used for PI).
      // Defaults via migration for legacy rows; new bookings always provide from slider.
      duration_minutes:
        durationMinutes ?? (params.serviceType === 'session_1on1' ? 30 : 15),
      ...(params.campaignId ? { campaign_id: params.campaignId } : {}),
      ...(params.marketingReferrer ? { marketing_referrer: params.marketingReferrer } : {}),
    };

    const { data: booking, error: bookingErr } = await (
      supabaseAdmin.from('bookings') as unknown as {
        insert: (values: Record<string, unknown>) => {
          select: () => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> };
        };
      }
    )
      .insert(bookingInsert)
      .select()
      .single();

    if (bookingErr || !booking) {
      throw new Error(
        `Failed to create database booking: ${bookingErr?.message ?? 'no row returned'}`,
      );
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
        amountCents: displayAmountCents,
      };
    }

    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: {
        app: 'astrolink',
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
      amountCents: displayAmountCents,
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
        audit: {
          agentId: this.agentId,
          operation: 'expert_match',
          refId: null,
        },
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
