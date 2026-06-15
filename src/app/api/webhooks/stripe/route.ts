import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import type { Json } from '@/lib/database.types';
import { syncMentorStripeAccountStatus } from '@/lib/mentor-stripe-connect';
import { fulfillBookingAfterPayment } from '@/lib/post-payment';
import { PaymentAgent } from '@/services/agents/payment-agent';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    // Shared-account safety: only process events carrying our app metadata (or legacy mentor-linked for Connect handlers)
    if (
      event.type === 'payment_intent.amount_capturable_updated' ||
      event.type === 'payment_intent.succeeded' ||
      event.type === 'payment_intent.payment_failed'
    ) {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const app = paymentIntent.metadata?.app;
      if (app && app !== 'astrolink') {
        return NextResponse.json({ received: true, skipped: 'foreign_app' });
      }
    }

    if (
      event.type === 'payment_intent.amount_capturable_updated' ||
      event.type === 'payment_intent.succeeded'
    ) {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      if (
        event.type === 'payment_intent.amount_capturable_updated' &&
        paymentIntent.status !== 'requires_capture'
      ) {
        return NextResponse.json({ received: true, skipped: true });
      }

      const mentorId = paymentIntent.metadata?.mentor_id;
      const menteeId = paymentIntent.metadata?.mentee_id;
      if (!mentorId || !menteeId) {
        return NextResponse.json({ received: true, skipped: 'missing_metadata' });
      }

      const platformFee =
        paymentIntent.application_fee_amount ??
        Math.round(paymentIntent.amount * 0.2);

      const destination =
        typeof paymentIntent.transfer_data?.destination === 'string'
          ? paymentIntent.transfer_data.destination
          : (paymentIntent.transfer_data?.destination as any)?.toString?.() ?? 'platform';

      await fulfillBookingAfterPayment({
        stripeEventId: event.id,
        paymentIntentId: paymentIntent.id,
        grossAmountCents: paymentIntent.amount,
        platformFeeCents: platformFee,
        destinationStripeAccount: destination,
        mentorId,
        menteeId,
      });
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .maybeSingle();

      if (booking?.id) {
        const paymentAgent = new PaymentAgent();
        await paymentAgent.handlePaymentFailed(booking.id);
      }
      return NextResponse.json({ received: true });
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
      if (piId) {
        const { data: booking } = await supabaseAdmin
          .from('bookings')
          .select('id')
          .eq('stripe_payment_intent_id', piId)
          .maybeSingle();
        if (booking) {
          // Reconcile: mark tx refunded (webhook is source of truth for external refunds too)
          await supabaseAdmin
            .from('transactions')
            .update({ status: 'refunded' })
            .eq('booking_id', booking.id);
          await supabaseAdmin
            .from('bookings')
            .update({ status: 'refunded' })
            .eq('id', booking.id);
          await supabaseAdmin.from('audit_log').insert({
            agent_id: 'APX-05',
            event: 'CHARGE_REFUNDED_WEBHOOK',
            ref_id: booking.id,
            payload: { charge_id: charge.id, payment_intent_id: piId } as Json,
          });
        }
      }
      return NextResponse.json({ received: true });
    }

    if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId = typeof dispute.charge === 'string' ? dispute.charge : (dispute.charge as any)?.id;
      if (chargeId) {
        // Best-effort: find tx/booking via recent charge? We can look up via audit or leave for ops.
        // Simpler: escalate any dispute on our platform to pending_review (ops will trace via Stripe dashboard + audit).
        await supabaseAdmin.from('audit_log').insert({
          agent_id: 'APX-05',
          event: 'CHARGE_DISPUTE_CREATED',
          ref_id: null,
          payload: {
            dispute_id: dispute.id,
            charge_id: chargeId,
            amount_cents: dispute.amount,
            reason: dispute.reason,
          } as Json,
        });
        // If we can map charge→PI→booking in future, set status pending_review here.
      }
      return NextResponse.json({ received: true });
    }

    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;
      let mentorId = account.metadata?.mentor_id;

      if (!mentorId && account.id) {
        const { data: mentorRow } = await supabaseAdmin
          .from('mentors')
          .select('id')
          .eq('stripe_connect_account_id', account.id)
          .maybeSingle();
        mentorId = mentorRow?.id;
      }

      if (mentorId && account.id) {
        await syncMentorStripeAccountStatus(mentorId, account.id);
      }
    }

    if (event.type === 'payout.paid' || event.type === 'payout.failed') {
      const payout = event.data.object as Stripe.Payout;
      const connectAccount =
        typeof event.account === 'string' ? event.account : event.account ?? 'platform';

      await supabaseAdmin.from('audit_log').insert({
        agent_id: 'APX-05',
        event: event.type === 'payout.paid' ? 'STRIPE_PAYOUT_PAID' : 'STRIPE_PAYOUT_FAILED',
        ref_id: null,
        payload: {
          stripe_payout_id: payout.id,
          amount_cents: payout.amount,
          currency: payout.currency,
          status: payout.status,
          arrival_date: payout.arrival_date,
          connect_account: connectAccount,
        } as Json,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook handler failed';
    console.error('Stripe webhook error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

