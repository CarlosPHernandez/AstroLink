import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import {
  isDevSkippedPaymentIntent,
  isStripePaymentsSkipped,
} from '@/lib/booking-payments';
import { fulfillBookingAfterPayment } from '@/lib/post-payment';
import { getSession } from '@/lib/session';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

type BookingPaymentRow = {
  id: string;
  status: string;
  stripe_payment_intent_id: string;
  mentee_id: string;
  mentor_id: string;
};

function paymentIntentDestination(paymentIntent: Stripe.PaymentIntent): string {
  const rawDestination = paymentIntent.transfer_data?.destination;
  return typeof rawDestination === 'string'
    ? rawDestination
    : rawDestination && typeof rawDestination === 'object' && 'id' in rawDestination
      ? String(rawDestination.id)
      : 'platform';
}

function paymentIntentMetadataMatches(
  paymentIntent: Stripe.PaymentIntent,
  booking: BookingPaymentRow,
): boolean {
  return (
    paymentIntent.metadata?.app === 'astrolink' &&
    paymentIntent.metadata?.mentee_id === booking.mentee_id &&
    paymentIntent.metadata?.mentor_id === booking.mentor_id
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id: bookingId } = await params;

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, status, stripe_payment_intent_id, mentee_id, mentor_id')
    .eq('id', bookingId)
    .single();

  const booking = data as BookingPaymentRow | null;
  if (error || !booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }

  if (booking.mentee_id !== session.userId && session.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  if (!booking.stripe_payment_intent_id) {
    return NextResponse.json(
      { success: false, error: 'Booking has no Stripe payment intent' },
      { status: 409 },
    );
  }

  if (
    isDevSkippedPaymentIntent(booking.stripe_payment_intent_id) ||
    isStripePaymentsSkipped()
  ) {
    const result = await fulfillBookingAfterPayment({
      stripeEventId: `client_confirm_${booking.stripe_payment_intent_id}`,
      paymentIntentId: booking.stripe_payment_intent_id,
      grossAmountCents: 0,
      platformFeeCents: 0,
      destinationStripeAccount: 'platform',
      mentorId: booking.mentor_id,
      menteeId: booking.mentee_id,
    });

    return NextResponse.json({ success: true, data: result });
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
  if (paymentIntent.status !== 'succeeded') {
    return NextResponse.json(
      { success: false, error: `Payment not confirmed yet (status: ${paymentIntent.status})` },
      { status: 409 },
    );
  }

  if (!paymentIntentMetadataMatches(paymentIntent, booking)) {
    return NextResponse.json(
      { success: false, error: 'Payment metadata mismatch' },
      { status: 409 },
    );
  }

  const platformFee =
    paymentIntent.application_fee_amount ?? Math.round(paymentIntent.amount * 0.2);

  const result = await fulfillBookingAfterPayment({
    stripeEventId: `client_confirm_${paymentIntent.id}`,
    paymentIntentId: paymentIntent.id,
    grossAmountCents: paymentIntent.amount,
    platformFeeCents: platformFee,
    destinationStripeAccount: paymentIntentDestination(paymentIntent),
    mentorId: booking.mentor_id,
    menteeId: booking.mentee_id,
  });

  return NextResponse.json({ success: true, data: result });
}
