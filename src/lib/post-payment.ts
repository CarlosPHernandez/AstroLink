import 'server-only';

import {
  isDevSkippedPaymentIntent,
  isStripePaymentsSkipped,
} from '@/lib/booking-payments';
import { createDailyRoomForBooking } from '@/lib/daily';
import { supabaseAdmin } from '@/lib/supabase';
import { BriefingAgent } from '@/services/agents/briefing-agent';
import { PaymentAgent } from '@/services/agents/payment-agent';

/**
 * Confirms a booking and runs APX-02 briefing + Daily room setup without Stripe.
 * Used when SKIP_STRIPE_PAYMENTS=true for local AI engine testing.
 */
export async function confirmBookingWithoutPayment(bookingId: string) {
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('id, status, daily_room_url')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }

  if (booking.status === 'confirmed' || booking.status === 'completed') {
    return { bookingId: booking.id, alreadyProcessed: true };
  }

  if (booking.status !== 'pending_payment') {
    throw new Error(`Cannot confirm booking in status: ${booking.status}`);
  }

  await supabaseAdmin.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId);

  const briefingAgent = new BriefingAgent();
  await briefingAgent.prepareBriefing(bookingId);

  if (!booking.daily_room_url && process.env.DAILY_API_KEY) {
    const daily = await createDailyRoomForBooking(bookingId);
    await supabaseAdmin
      .from('bookings')
      .update({
        daily_room_url: daily.roomUrl,
        mentee_token: daily.menteeToken,
        mentor_token: daily.mentorToken,
      })
      .eq('id', bookingId);
  }

  return { bookingId, alreadyProcessed: false };
}

/**
 * Idempotent D1 fulfillment after Stripe authorizes payment (manual capture / escrow).
 */
export async function fulfillBookingAfterPayment(params: {
  stripeEventId: string;
  paymentIntentId: string;
  grossAmountCents: number;
  platformFeeCents: number;
  destinationStripeAccount: string;
  mentorId: string;
  menteeId: string;
}) {
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('id, status, daily_room_url')
    .eq('stripe_payment_intent_id', params.paymentIntentId)
    .single();

  if (error || !booking) {
    throw new Error(`No booking for payment intent ${params.paymentIntentId}`);
  }

  if (booking.status === 'confirmed' || booking.status === 'completed') {
    return { bookingId: booking.id, alreadyProcessed: true };
  }

  if (isDevSkippedPaymentIntent(params.paymentIntentId) || isStripePaymentsSkipped()) {
    return confirmBookingWithoutPayment(booking.id);
  }

  const paymentAgent = new PaymentAgent();
  await paymentAgent.handlePaymentSucceeded({
    stripeEventId: params.stripeEventId,
    paymentIntentId: params.paymentIntentId,
    grossAmountCents: params.grossAmountCents,
    platformFeeCents: params.platformFeeCents,
    destinationStripeAccount: params.destinationStripeAccount,
    metadata: {
      booking_id: booking.id,
      mentor_id: params.mentorId,
      mentee_id: params.menteeId,
    },
  });

  const briefingAgent = new BriefingAgent();
  await briefingAgent.prepareBriefing(booking.id);

  if (!booking.daily_room_url) {
    const daily = await createDailyRoomForBooking(booking.id);
    await supabaseAdmin
      .from('bookings')
      .update({
        daily_room_url: daily.roomUrl,
        mentee_token: daily.menteeToken,
        mentor_token: daily.mentorToken,
      })
      .eq('id', booking.id);
  }

  return { bookingId: booking.id, alreadyProcessed: false };
}
