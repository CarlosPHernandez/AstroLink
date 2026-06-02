import { NextResponse } from 'next/server';
import { z } from 'zod';

import { dailyRoomNameForBooking, extractDailyRoomNameFromUrl, provisionDailyRoomForBooking } from '@/lib/daily';
import { fulfillBookingAfterMeetingEnded } from '@/lib/post-session';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

const BodySchema = z.object({
  bookingId: z.string().uuid(),
  action: z.enum(['status', 'provision', 'simulate_meeting_ended']),
});

async function assertBookingAccess(bookingId: string, userId: string, role: string) {
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('id, status, mentee_id, mentor_id, daily_room_url, stripe_payment_intent_id, scheduled_at')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    return { error: NextResponse.json({ error: 'Booking not found' }, { status: 404 }) };
  }

  const isParticipant =
    userId === booking.mentee_id || userId === booking.mentor_id || role === 'admin';

  if (!isParticipant) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { booking };
}

/**
 * Dev-only operator for demo rehearsal: inspect status, re-provision, simulate meeting.ended.
 * POST /api/dev/session-operator
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bookingId, action } = BodySchema.parse(await request.json());
    const access = await assertBookingAccess(bookingId, session.userId, session.role);
    if ('error' in access && access.error) {
      return access.error;
    }

    const booking = access.booking!;

    if (action === 'status') {
      const roomName =
        (booking.daily_room_url && extractDailyRoomNameFromUrl(booking.daily_room_url)) ||
        dailyRoomNameForBooking(bookingId);

      const { data: sessionRow } = await supabaseAdmin
        .from('sessions')
        .select('id, duration_minutes, created_at')
        .eq('booking_id', bookingId)
        .maybeSingle();

      return NextResponse.json({
        bookingId,
        status: booking.status,
        dailyRoomUrl: booking.daily_room_url,
        dailyRoomName: roomName,
        stripePaymentIntentId: booking.stripe_payment_intent_id,
        scheduledAt: booking.scheduled_at,
        sessionRecord: sessionRow ?? null,
        dailyApiConfigured: Boolean(process.env.DAILY_API_KEY),
        webhookHmacConfigured: Boolean(process.env.DAILY_WEBHOOK_HMAC),
      });
    }

    if (action === 'provision') {
      if (!process.env.DAILY_API_KEY) {
        return NextResponse.json({ error: 'DAILY_API_KEY is not configured' }, { status: 503 });
      }
      const result = await provisionDailyRoomForBooking(bookingId);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'simulate_meeting_ended') {
      const roomName =
        (booking.daily_room_url && extractDailyRoomNameFromUrl(booking.daily_room_url)) ||
        dailyRoomNameForBooking(bookingId);

      const now = Math.floor(Date.now() / 1000);
      const result = await fulfillBookingAfterMeetingEnded({
        room: roomName,
        start_ts: now - 1800,
        end_ts: now,
        meeting_id: `dev_sim_${bookingId.slice(0, 8)}`,
      });

      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Operator action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
