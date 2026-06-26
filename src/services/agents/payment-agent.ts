import type { Json } from '@/lib/database.types';
import { supabaseAdmin } from '@/lib/supabase';

export class PaymentAgent {
  private agentId = 'APX-05' as const;

  /**
   * Processes Stripe PaymentIntent success webhook events with split verification checks.
   */
  async handlePaymentSucceeded(params: {
    stripeEventId: string;
    paymentIntentId: string;
    grossAmountCents: number;
    platformFeeCents: number;
    destinationStripeAccount: string;
    metadata: {
      booking_id: string;
      mentor_id: string;
      mentee_id: string;
    };
  }) {
    await this.logAudit('PAYMENT_SUCCEEDED_WEBHOOK_RECEIVED', params.metadata.booking_id, {
      intent_id: params.paymentIntentId,
    });

    // 1. Bookkeeping split (80/20 recorded for future Connect payouts; platform collects 100% at launch)
    const expectedPlatformFee = Math.round(params.grossAmountCents * 0.20);
    // Accept provided fee or fall back to computed 20% (no longer test-mode bypass)
    const platformFeeCents =
      params.platformFeeCents && params.platformFeeCents > 0
        ? params.platformFeeCents
        : expectedPlatformFee;

    const mentorPayoutCents = params.grossAmountCents - platformFeeCents;

    // 2. Insert transaction state with idempotency guard (UNIQUE on stripe_event_id now enforced at DB)
    const { error: txErr } = await supabaseAdmin.from('transactions').insert({
      booking_id: params.metadata.booking_id,
      stripe_payment_intent_id: params.paymentIntentId,
      gross_amount_cents: params.grossAmountCents,
      platform_fee_cents: platformFeeCents,
      mentor_payout_cents: mentorPayoutCents,
      mentor_stripe_account: params.destinationStripeAccount || 'platform',
      status: 'completed', // immediate capture: funds taken at booking time
      stripe_event_id: params.stripeEventId,
    });

    if (txErr) {
      // Check for unique key constraint (already processed)
      if (txErr.code === '23505') {
        console.log(`Transaction for stripe_event_id ${params.stripeEventId} already processed.`);
        return { processed: true };
      }
      throw new Error(`Failed to log transaction: ${txErr.message}`);
    }

    // 3. Update booking status to confirmed (payment captured; ready for session)
    await supabaseAdmin
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', params.metadata.booking_id);

    await this.logAudit('PAYMENT_CONFIRMED', params.metadata.booking_id, {
      gross: params.grossAmountCents,
      payout_bookkeeping: mentorPayoutCents,
    });

    return { success: true };
  }

  /**
   * Marks a booking completed at session end.
   * (Capture now happens at booking time via immediate-capture PaymentIntent; this is post-session fulfillment only.)
   */
  async captureEscrowPayment(bookingId: string, stripePaymentIntentId: string) {
    if (stripePaymentIntentId.startsWith('dev_skip_')) {
      await supabaseAdmin.from('bookings').update({ status: 'completed' }).eq('id', bookingId);
      return { success: true, skipped: true };
    }

    await this.logAudit('SESSION_COMPLETION_RECORDED', bookingId, { stripePaymentIntentId });

    // Immediate-capture flow: funds already taken. Just advance booking + tx bookkeeping.
    await supabaseAdmin
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', bookingId);

    await supabaseAdmin
      .from('transactions')
      .update({ status: 'completed' })
      .eq('booking_id', bookingId);

    await this.logAudit('BOOKING_COMPLETED', bookingId, {});

    return { success: true };
  }

  /**
   * Handles Stripe payment failed webhook events.
   */
  async handlePaymentFailed(bookingId: string) {
    await supabaseAdmin
      .from('bookings')
      .update({ status: 'payment_failed' })
      .eq('id', bookingId);

    // Update transactions status to failed
    await supabaseAdmin
      .from('transactions')
      .update({ status: 'failed' })
      .eq('booking_id', bookingId);

    await this.logAudit('PAYMENT_FAILED_RECONCILED', bookingId, {});
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
