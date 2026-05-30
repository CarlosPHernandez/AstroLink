import { ai, callGeminiWithBackoff } from '@/lib/gemini';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { MatchingOutput, ServiceType } from '@/lib/types';

export class BookingAgent {
  private agentId = 'APX-01';

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
    servicePriceCents: number;
  }) {
    // 1. Audit Log: BOOKING_INITIATED
    await this.logAudit('BOOKING_INITIATED', null, { params });

    let finalMentorId = params.mentorId;
    let matchReason = 'User selected mentor directly.';

    // 2. Matching Engine (if no mentor selected)
    if (!finalMentorId) {
      const matchResult = await this.matchMentor({
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

    // Retrieve selected mentor's stripe connect account id
    const { data: mentor, error: mentorErr } = await supabaseAdmin
      .from('mentors')
      .select('stripe_connect_account_id')
      .eq('id', finalMentorId)
      .single();

    if (mentorErr || !mentor || !mentor.stripe_connect_account_id) {
      throw new Error(`Mentor lookup failed or mentor does not have a linked Stripe Connect account.`);
    }

    // 3. Create Stripe Escrow (Manual Capture)
    const platformFee = Math.round(params.servicePriceCents * 0.20); // 20% Platform fee
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.servicePriceCents,
      currency: 'usd',
      payment_method_types: ['card'],
      capture_method: 'manual', // Holds funds up to 7 days
      application_fee_amount: platformFee,
      transfer_data: {
        destination: mentor.stripe_connect_account_id,
      },
      metadata: {
        mentor_id: finalMentorId,
        mentee_id: params.menteeId,
        service_type: params.serviceType,
      },
    });

    // 4. Create booking record in database
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .insert({
        mentee_id: params.menteeId,
        mentor_id: finalMentorId,
        service_type: params.serviceType,
        status: 'pending_payment',
        scheduled_at: params.scheduledAt,
        stripe_payment_intent_id: paymentIntent.id,
        match_reason: matchReason,
      })
      .select()
      .single();

    if (bookingErr) {
      throw new Error(`Failed to create database booking: ${bookingErr.message}`);
    }

    await this.logAudit('BOOKING_CREATED', booking.id, {
      booking_id: booking.id,
      stripe_intent_id: paymentIntent.id,
    });

    return {
      bookingId: booking.id,
      stripeClientSecret: paymentIntent.client_secret,
      matchReason,
    };
  }

  /**
   * Matches a mentee with the optimal mentor using Gemini 2.5 Flash.
   */
  private async matchMentor(input: {
    menteeGoals: string;
    menteeBackground: string;
    serviceType: string;
  }): Promise<MatchingOutput> {
    // Retrieve mentor pool from database
    const { data: mentors } = await supabaseAdmin
      .from('mentors')
      .select('id, full_name, employer, expertise, bio')
      .eq('compliance_status', 'approved');

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

    const runMatch = async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: matchingSystemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              mentor_id: { type: 'STRING' },
              match_score: { type: 'NUMBER' },
              match_reason: { type: 'STRING' },
            },
            required: ['mentor_id', 'match_score', 'match_reason'],
          },
        },
      });

      return JSON.parse(response.text || '{}') as MatchingOutput;
    };

    return callGeminiWithBackoff(runMatch);
  }

  private async logAudit(event: string, refId: string | null, payload: object) {
    await supabaseAdmin.from('audit_log').insert({
      agent_id: this.agentId,
      event,
      ref_id: refId,
      payload,
    });
  }
}
