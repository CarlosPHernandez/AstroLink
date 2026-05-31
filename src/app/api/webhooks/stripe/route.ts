import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { fulfillBookingAfterPayment } from '@/lib/post-payment';
import { stripe } from '@/lib/stripe';

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

      const mentorId = paymentIntent.metadata.mentor_id;
      const menteeId = paymentIntent.metadata.mentee_id;
      if (!mentorId || !menteeId) {
        return NextResponse.json({ received: true, skipped: 'missing_metadata' });
      }

      const platformFee =
        paymentIntent.application_fee_amount ??
        Math.round(paymentIntent.amount * 0.2);

      const destination =
        typeof paymentIntent.transfer_data?.destination === 'string'
          ? paymentIntent.transfer_data.destination
          : paymentIntent.transfer_data?.destination?.toString() ?? 'platform_test';

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

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook handler failed';
    console.error('Stripe webhook error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
