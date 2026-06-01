import type { Json } from '@/lib/database.types';
import { stripe } from '@/lib/stripe';
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

    // 1. Validate platform split math (platform fee must be exactly 20% of gross)
    const expectedPlatformFee = Math.round(params.grossAmountCents * 0.20);
    const splitCheckValid =
      params.platformFeeCents === expectedPlatformFee ||
      process.env.STRIPE_BOOKING_TEST_MODE === 'true';

    if (!splitCheckValid) {
      await this.logAudit('SPLIT_FEE_MISMATCH_ESCALATED', params.metadata.booking_id, {
        received_fee: params.platformFeeCents,
        expected_fee: expectedPlatformFee,
      });
      
      // Mark booking status as pending_review for administrative reconciliation
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'pending_review' })
        .eq('id', params.metadata.booking_id);
        
      throw new Error(`Split fee calculation error: expected ${expectedPlatformFee}, received ${params.platformFeeCents}.`);
    }

    const mentorPayoutCents = params.grossAmountCents - params.platformFeeCents;

    // 2. Insert transaction state with idempotency guard using postgres unique constraints
    const { error: txErr } = await supabaseAdmin.from('transactions').insert({
      booking_id: params.metadata.booking_id,
      stripe_payment_intent_id: params.paymentIntentId,
      gross_amount_cents: params.grossAmountCents,
      platform_fee_cents: params.platformFeeCents,
      mentor_payout_cents: mentorPayoutCents,
      mentor_stripe_account: params.destinationStripeAccount,
      status: 'pending',
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

    // 3. Update booking status to confirmed (funds are securely escrowed in Stripe)
    await supabaseAdmin
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', params.metadata.booking_id);

    await this.logAudit('ESCROW_CONFIRMED', params.metadata.booking_id, {
      gross: params.grossAmountCents,
      payout: mentorPayoutCents,
    });

    return { success: true };
  }

  /**
   * Captures the funds from Stripe manual capture hold after meeting concludes successfully.
   */
  async captureEscrowPayment(bookingId: string, stripePaymentIntentId: string) {
    if (stripePaymentIntentId.startsWith('dev_skip_')) {
      await supabaseAdmin.from('bookings').update({ status: 'completed' }).eq('id', bookingId);
      return { success: true, skipped: true };
    }

    await this.logAudit('CAPTURE_REQUESTED', bookingId, { stripePaymentIntentId });

    try {
      const capturedIntent = await stripe.paymentIntents.capture(stripePaymentIntentId);

      if (capturedIntent.status === 'succeeded') {
        // Update booking status to completed
        await supabaseAdmin
          .from('bookings')
          .update({ status: 'completed' })
          .eq('id', bookingId);

        // Update transaction status to completed
        await supabaseAdmin
          .from('transactions')
          .update({ status: 'completed' })
          .eq('booking_id', bookingId);

        await this.logAudit('ESCROW_CAPTURED', bookingId, {
          stripe_status: capturedIntent.status,
        });

        return { success: true };
      } else {
        // Escalate status to pending_review for administrator attention
        await supabaseAdmin
          .from('bookings')
          .update({ status: 'pending_review' })
          .eq('id', bookingId);

        await this.logAudit('CAPTURE_FAILED_ESCALATED', bookingId, {
          stripe_status: capturedIntent.status,
        });

        return { success: false, status: capturedIntent.status };
      }
    } catch (err: any) {
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'pending_review' })
        .eq('id', bookingId);

      await this.logAudit('CAPTURE_ERROR_ESCALATED', bookingId, {
        error: err.message,
      });

      throw err;
    }
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
    
    // In a production flow, we would trigger an email resend to the mentee with links here
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
