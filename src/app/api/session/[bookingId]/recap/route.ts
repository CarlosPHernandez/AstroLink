import { NextResponse } from 'next/server';

import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import type { PostSessionOutput } from '@/lib/types';

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

function isPostSessionOutput(value: unknown): value is PostSessionOutput {
  return (
    typeof value === 'object' &&
    value !== null &&
    'session_summary' in value &&
    'key_insights' in value
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookingId } = await context.params;

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('id, mentee_id, mentor_id, status')
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

  const { data: sessionRow, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .select('summary_json, transcript_available, duration_seconds, completed_at')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  if (!sessionRow) {
    return NextResponse.json({
      bookingId,
      status: booking.status,
      ready: false,
      recap: null,
      transcriptAvailable: false,
    });
  }

  const recap = isPostSessionOutput(sessionRow.summary_json) ? sessionRow.summary_json : null;

  return NextResponse.json({
    bookingId,
    status: booking.status,
    ready: recap !== null,
    recap,
    transcriptAvailable: sessionRow.transcript_available,
    durationSeconds: sessionRow.duration_seconds,
    completedAt: sessionRow.completed_at,
  });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
