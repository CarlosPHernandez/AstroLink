import { NextResponse } from 'next/server';

import { extractDailyRoomNameFromUrl } from '@/lib/daily';
import { fulfillBookingAfterMeetingEndedForBooking } from '@/lib/post-session';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

/**
 * Participant-triggered session completion (webhook fallback).
 * When Daily ejects or a user ends the call, the client POSTs here so the booking
 * becomes `completed` and APX-03 can run even if meeting.ended never arrives.
 *
 * Idempotent: already-completed bookings re-run fulfillment safely.
 * POST /api/session/[bookingId]/complete
 */
export async function POST(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookingId } = await context.params;

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('id, status, mentee_id, mentor_id, daily_room_url, duration_minutes, scheduled_at')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const isParticipant =
    session.userId === booking.mentee_id ||
    session.userId === booking.mentor_id ||
    session.role === 'admin';

  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (booking.status === 'pending_payment' || booking.status === 'payment_failed') {
    return NextResponse.json(
      { error: `Cannot complete booking with status: ${booking.status}` },
      { status: 400 },
    );
  }

  if (
    booking.status !== 'confirmed' &&
    booking.status !== 'completed'
  ) {
    return NextResponse.json(
      { error: `Cannot complete booking with status: ${booking.status}` },
      { status: 400 },
    );
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const durationMin =
    typeof booking.duration_minutes === 'number' && booking.duration_minutes > 0
      ? booking.duration_minutes
      : 30;
  const scheduledSec = booking.scheduled_at
    ? Math.floor(new Date(booking.scheduled_at).getTime() / 1000)
    : nowSec - durationMin * 60;
  const start_ts = Number.isFinite(scheduledSec) ? scheduledSec : nowSec - durationMin * 60;
  const end_ts = Math.max(start_ts + 60, nowSec);

  const room =
    (booking.daily_room_url && extractDailyRoomNameFromUrl(booking.daily_room_url)) ||
    undefined;

  try {
    const result = await fulfillBookingAfterMeetingEndedForBooking(bookingId, {
      room,
      start_ts,
      end_ts,
    });

    console.info('[session/complete]', {
      bookingId,
      userId: session.userId,
      alreadyCompleted: booking.status === 'completed',
      result,
    });

    return NextResponse.json({
      success: true,
      bookingId,
      ...result,
    });
  } catch (err: unknown) {
    console.error('[session/complete]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not complete session' },
      { status: 500 },
    );
  }
}
