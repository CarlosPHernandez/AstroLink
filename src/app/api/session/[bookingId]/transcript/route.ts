import { NextResponse } from 'next/server';

import { resolveSessionTranscriptForBooking } from '@/lib/transcript-translation/resolve-session-transcript';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookingId } = await context.params;

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('id, mentee_id, mentor_id')
    .eq('id', bookingId)
    .maybeSingle();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const isParticipant =
    session.userId === booking.mentee_id ||
    session.userId === booking.mentor_id ||
    session.role === 'admin';

  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let resolved: Awaited<ReturnType<typeof resolveSessionTranscriptForBooking>>;
  try {
    resolved = await resolveSessionTranscriptForBooking({
      bookingId,
      mentorId: booking.mentor_id,
      menteeId: booking.mentee_id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Transcript lookup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (resolved.status === 'not_found') {
    return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
  }

  if (resolved.status === 'empty') {
    return NextResponse.json({
      bookingId,
      sourceLocale: resolved.sourceLocale,
      utterances: [],
      status: 'empty' as const,
      hasVtt: resolved.hasVtt,
    });
  }

  return NextResponse.json({
    bookingId,
    sourceLocale: resolved.sourceLocale,
    utterances: resolved.utterances,
    status: 'ready' as const,
    backfilled: resolved.backfilled,
  });
}
