import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fulfillBookingAfterPayment } from '@/lib/post-payment';
import { getSession } from '@/lib/session';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

const BodySchema = z.object({
  bookingId: z.string().uuid(),
});

/**
 * Dev helper when Stripe CLI webhook forwarding is not running.
 * POST /api/book/fulfill { "bookingId": "..." }
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bookingId } = BodySchema.parse(await request.json());

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('stripe_payment_intent_id, mentee_id, mentor_id')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.mentee_id !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);

    if (paymentIntent.status !== 'requires_capture' && paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: `Payment not authorized yet (status: ${paymentIntent.status})` },
        { status: 400 }
      );
    }

    const platformFee =
      paymentIntent.application_fee_amount ?? Math.round(paymentIntent.amount * 0.2);

    const result = await fulfillBookingAfterPayment({
      stripeEventId: `dev_fulfill_${bookingId}`,
      paymentIntentId: paymentIntent.id,
      grossAmountCents: paymentIntent.amount,
      platformFeeCents: platformFee,
      destinationStripeAccount:
        (typeof paymentIntent.transfer_data?.destination === 'string'
          ? paymentIntent.transfer_data.destination
          : paymentIntent.transfer_data?.destination?.toString()) ?? 'platform_test',
      mentorId: booking.mentor_id,
      menteeId: booking.mentee_id,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fulfill failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
