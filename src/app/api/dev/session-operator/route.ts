import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  canProvisionDailyRoom,
  dailyRoomNameForBooking,
  extractDailyRoomNameFromUrl,
  isDailyProvisionEnabled,
  isDailyTranscriptionEnabled,
  provisionDailyRoomForBooking,
} from '@/lib/daily';
import { fulfillBookingAfterMeetingEnded, ingestTranscriptVttForBooking } from '@/lib/post-session';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

const BodySchema = z.object({
  bookingId: z.string().uuid(),
  action: z.enum(['status', 'provision', 'simulate_meeting_ended', 'simulate_transcript_ready']),
});

const SAMPLE_VTT_PATH = join(
  process.cwd(),
  'src/lib/transcript-translation/__fixtures__/sample.vtt',
);

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
        .select('id, duration_seconds, transcript_available, completed_at')
        .eq('booking_id', bookingId)
        .maybeSingle();

      const { data: transcriptRow } = await supabaseAdmin
        .from('session_transcripts')
        .select('id, daily_transcript_id, created_at')
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
        transcriptRecord: transcriptRow ?? null,
        dailyApiConfigured: Boolean(process.env.DAILY_API_KEY),
        dailyProvisionEnabled: isDailyProvisionEnabled(),
        dailyTranscriptionEnabled: isDailyTranscriptionEnabled(),
        canProvisionDailyRoom: canProvisionDailyRoom(),
        webhookHmacConfigured: Boolean(process.env.DAILY_WEBHOOK_HMAC),
      });
    }

    if (action === 'provision') {
      if (!canProvisionDailyRoom()) {
        return NextResponse.json(
          { error: 'Daily room provisioning is disabled (set DAILY_PROVISION_ENABLED=true and DAILY_API_KEY)' },
          { status: 503 },
        );
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

    if (action === 'simulate_transcript_ready') {
      const vttText = readFileSync(SAMPLE_VTT_PATH, 'utf8');
      const result = await ingestTranscriptVttForBooking({
        bookingId,
        vttText,
        dailyTranscriptId: `dev_sim_${bookingId.slice(0, 8)}`,
        durationMinutes: 30,
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
