import { NextResponse } from 'next/server';

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

  if (booking.tokenError) {
    return NextResponse.json({ error: booking.tokenError }, { status: 502 });
  }

  if (booking.gate !== 'ready' || !booking.dailyJoinUrl) {
    return NextResponse.json({ error: 'Session is not ready for video' }, { status: 400 });
  }

  return NextResponse.json({ joinUrl: booking.dailyJoinUrl });
}
