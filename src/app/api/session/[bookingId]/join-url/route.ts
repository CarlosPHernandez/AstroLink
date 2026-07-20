import { NextResponse } from 'next/server';

import { buildAuthorizedDailyJoinUrl } from '@/lib/daily';
import { getBookingForSession } from '@/lib/booking-access';

/**
 * Mint a fresh Daily meeting token for the current participant.
 * GET /api/session/[bookingId]/join-url
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await context.params;
  const { booking, forbidden } = await getBookingForSession(bookingId);

  if (forbidden) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.gate !== 'ready' || !booking.dailyRoomUrl) {
    return NextResponse.json({ error: 'Session is not ready for video' }, { status: 400 });
  }

  try {
    const joinUrl = await buildAuthorizedDailyJoinUrl({
      roomUrl: booking.dailyRoomUrl,
      userId: booking.viewerId,
      userName: booking.viewerName,
      isOwner: booking.sessionRole === 'mentor' || booking.sessionRole === 'admin',
      scheduledAt: booking.scheduledAt,
      durationMinutes: booking.durationMinutes,
    });

    return NextResponse.json({ joinUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Meeting token failed';
    console.error('[session] meeting token mint failed', { bookingId, message });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
