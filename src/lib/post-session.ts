import 'server-only';

import { isDevSkippedPaymentIntent } from '@/lib/booking-payments';
import { supabaseAdmin } from '@/lib/supabase';
import { PaymentAgent } from '@/services/agents/payment-agent';
import { SessionAgent } from '@/services/agents/session-agent';

export type MeetingEndedPayload = {
  room: string;
  start_ts: number;
  end_ts: number;
  meeting_id?: string;
};

/**
 * Idempotent D1 fulfillment after Daily reports meeting.ended:
 * APX-03 synthesis (transcript optional in D1) then APX-05 escrow capture.
 */
export async function fulfillBookingAfterMeetingEnded(payload: MeetingEndedPayload) {
  const roomName = payload.room.trim();
  if (!roomName) {
    throw new Error('Daily meeting.ended missing room name');
  }

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('id, status, stripe_payment_intent_id, daily_room_url')
    .ilike('daily_room_url', `%/${roomName}`)
    .maybeSingle();

  if (error) {
    throw new Error(`Booking lookup failed: ${error.message}`);
  }
  if (!booking) {
    return { processed: false, reason: 'booking_not_found' as const };
  }

  if (booking.status === 'completed') {
    return { processed: true, bookingId: booking.id, alreadyProcessed: true };
  }

  if (booking.status !== 'confirmed') {
    return {
      processed: false,
      bookingId: booking.id,
      reason: 'invalid_booking_status' as const,
      status: booking.status,
    };
  }

  const durationMinutes = Math.max(
    1,
    Math.round((payload.end_ts - payload.start_ts) / 60) || 1,
  );

  const { data: existingSession } = await supabaseAdmin
    .from('sessions')
    .select('id')
    .eq('booking_id', booking.id)
    .maybeSingle();

  if (!existingSession) {
    const sessionAgent = new SessionAgent();
    await sessionAgent.synthesizeSession(booking.id, '', durationMinutes);
  }

  if (!isDevSkippedPaymentIntent(booking.stripe_payment_intent_id)) {
    const paymentAgent = new PaymentAgent();
    await paymentAgent.captureEscrowPayment(booking.id, booking.stripe_payment_intent_id);
  } else {
    await supabaseAdmin.from('bookings').update({ status: 'completed' }).eq('id', booking.id);
  }

  return { processed: true, bookingId: booking.id, alreadyProcessed: false };
}
