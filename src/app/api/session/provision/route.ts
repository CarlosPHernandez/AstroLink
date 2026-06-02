import { NextResponse } from 'next/server';
import { z } from 'zod';

import { provisionDailyRoomForBooking } from '@/lib/daily';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

const BodySchema = z.object({
  bookingId: z.string().uuid(),
});

/**
 * Retry Daily room provisioning for a confirmed booking missing daily_room_url.
 * POST /api/session/provision { "bookingId": "..." }
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bookingId } = BodySchema.parse(await request.json());

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('id, status, mentee_id, mentor_id, daily_room_url')
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

    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: `Cannot provision room for status: ${booking.status}` },
        { status: 400 },
      );
    }

    if (!process.env.DAILY_API_KEY) {
      return NextResponse.json({ error: 'DAILY_API_KEY is not configured' }, { status: 503 });
    }

    const result = await provisionDailyRoomForBooking(bookingId);

    console.info('[session/provision]', {
      bookingId,
      created: result.created,
      roomName: result.roomName,
      userId: session.userId,
    });

    return NextResponse.json({
      success: true,
      roomUrl: result.roomUrl,
      roomName: result.roomName,
      created: result.created,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Provision failed';
    console.error('[session/provision] failed', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
