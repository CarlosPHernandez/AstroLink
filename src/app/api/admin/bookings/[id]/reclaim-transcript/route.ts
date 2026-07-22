import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiRole } from '@/lib/api-auth';
import { extractDailyRoomNameFromUrl } from '@/lib/daily';
import type { Json } from '@/lib/database.types';
import { fulfillBookingAfterTranscriptReady } from '@/lib/post-session';
import { supabaseAdmin } from '@/lib/supabase';

const BookingIdSchema = z.string().uuid();
const BodySchema = z.object({
  transcriptId: z.string().min(1),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Admin recovery: re-fetch Daily WebVTT by transcript id and persist for a booking.
 * POST /api/admin/bookings/[id]/reclaim-transcript
 * Body: { "transcriptId": "<Daily transcript id>" }
 */
export async function POST(request: Request, context: RouteContext) {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }
  const session = sessionOrResponse;

  const { id: rawId } = await context.params;
  const parsedId = BookingIdSchema.safeParse(rawId);
  if (!parsedId.success) {
    return NextResponse.json({ success: false, error: 'Invalid booking ID' }, { status: 400 });
  }
  const bookingId = parsedId.data;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { success: false, error: 'transcriptId is required' },
      { status: 400 },
    );
  }

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('id, daily_room_url, status')
    .eq('id', bookingId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }
  if (!booking.daily_room_url) {
    return NextResponse.json(
      { success: false, error: 'Booking has no Daily room URL' },
      { status: 400 },
    );
  }

  const roomName = extractDailyRoomNameFromUrl(booking.daily_room_url);
  if (!roomName) {
    return NextResponse.json(
      { success: false, error: 'Could not parse Daily room name from booking' },
      { status: 400 },
    );
  }

  try {
    const result = await fulfillBookingAfterTranscriptReady({
      transcriptId: body.transcriptId.trim(),
      roomName,
    });

    await supabaseAdmin.from('audit_log').insert({
      agent_id: 'APX-03',
      event: 'TRANSCRIPT_RECLAIM',
      ref_id: bookingId,
      payload: {
        transcriptId: body.transcriptId.trim(),
        adminUserId: session.userId,
        result,
      } as Json,
    });

    if ('processed' in result && result.processed === false) {
      return NextResponse.json(
        { success: false, bookingId, ...result },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      bookingId,
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reclaim failed';
    console.error('[admin/reclaim-transcript]', { bookingId, error: message });
    await supabaseAdmin.from('audit_log').insert({
      agent_id: 'APX-03',
      event: 'TRANSCRIPT_RECLAIM_FAILED',
      ref_id: bookingId,
      payload: {
        transcriptId: body.transcriptId.trim(),
        adminUserId: session.userId,
        error: message,
      } as Json,
    });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
