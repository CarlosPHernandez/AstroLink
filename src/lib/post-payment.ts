import 'server-only';

import {
  isDevSkippedPaymentIntent,
  isStripePaymentsSkipped,
} from '@/lib/booking-payments';
import { briefingContentReady, type BriefingPayload } from '@/lib/briefing-display';
import { canProvisionDailyRoom, provisionDailyRoomForBooking } from '@/lib/daily';
import { isLlmRateLimitError } from '@/lib/llm';
import { supabaseAdmin } from '@/lib/supabase';
import { BriefingAgent } from '@/services/agents/briefing-agent';
import { NotificationAgent } from '@/services/agents/notification-agent';
import { PaymentAgent } from '@/services/agents/payment-agent';

/**
 * APX-02 briefing, Daily room, and APX-08 confirmation emails after a booking is confirmed.
 */
export async function runConfirmedBookingFulfillment(bookingId: string) {
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('id, daily_room_url, briefing_json')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }

  const briefing = (booking.briefing_json as BriefingPayload | null) ?? null;
  if (!briefing || !briefingContentReady(briefing, 'mentee')) {
    try {
      const briefingAgent = new BriefingAgent();
      await briefingAgent.prepareBriefing(bookingId);
    } catch (err: unknown) {
      if (isLlmRateLimitError(err)) {
        console.warn(`Briefing rate limited for booking ${bookingId}, will be retriable from dashboard.`);
      } else {
        console.error(`Briefing generation failed for booking ${bookingId}:`, err);
      }
      // Do not throw — payment confirmation, tx, and other fulfillment (daily, email) should still succeed.
      // User can retry brief generation manually from the mentee dashboard.
    }
  }

  if (!booking.daily_room_url && canProvisionDailyRoom()) {
    try {
      await provisionDailyRoomForBooking(bookingId);
    } catch (err) {
      console.error(`Daily room provisioning failed for booking ${bookingId}:`, err);
    }
  }

  const notificationAgent = new NotificationAgent();
  await notificationAgent.sendBookingConfirmations(bookingId);
}

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

  await runConfirmedBookingFulfillment(bookingId);

  return { bookingId, alreadyProcessed: false };
}

export async function recordBookingPaymentSucceeded(params: {
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
    .select('id, status')
    .eq('stripe_payment_intent_id', params.paymentIntentId)
    .single();

  if (error || !booking) {
    throw new Error(`No booking for payment intent ${params.paymentIntentId}`);
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
    confirmBooking: booking.status !== 'completed',
    metadata: {
      booking_id: booking.id,
      mentor_id: params.mentorId,
      mentee_id: params.menteeId,
    },
  });

  return {
    bookingId: booking.id,
    alreadyProcessed: booking.status === 'confirmed' || booking.status === 'completed',
  };
}

/**
 * Idempotent D1 fulfillment after Stripe immediate-capture PaymentIntent succeeds.
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
  const result = await recordBookingPaymentSucceeded(params);

  if (isDevSkippedPaymentIntent(params.paymentIntentId) || isStripePaymentsSkipped()) {
    return result;
  }

  await runConfirmedBookingFulfillment(result.bookingId);

  return result;
}
