import { NextResponse } from 'next/server';
import { canRefreshBriefing } from '@/lib/briefing-auth';
import type { BriefingPayload } from '@/lib/briefing-display';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import type { BookingStatus } from '@/lib/types';

type BookingStatusRow = {
  id: string;
  status: BookingStatus;
  scheduled_at: string;
  briefing_json: unknown;
  mentee_id: string;
  mentor_id: string;
  mentors: { full_name: string } | null;
};

/**
 * Poll booking confirmation + briefing for Chris campaign post-payment UX.
 * Generic booking flows still use dashboard ?booked= — this endpoint is read-only.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: bookingId } = await params;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(
      'id, status, scheduled_at, briefing_json, mentee_id, mentor_id, mentors(full_name)',
    )
    .eq('id', bookingId)
    .single();

  const booking = data as BookingStatusRow | null;

  if (error || !booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }

  if (
    !canRefreshBriefing({
      sessionUserId: session.userId,
      sessionRole: session.role,
      bookingMenteeId: booking.mentee_id,
      bookingMentorId: booking.mentor_id,
    })
  ) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    data: {
      bookingId: booking.id,
      status: booking.status,
      scheduledAt: booking.scheduled_at,
      mentorName: booking.mentors?.full_name ?? 'Your expert',
      briefing: (booking.briefing_json as BriefingPayload | null) ?? null,
    },
  });
}