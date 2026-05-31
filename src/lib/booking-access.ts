import 'server-only';

import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import type { MentorBriefingOutput, PreCallBriefOutput } from '@/lib/types';

export interface BookingSessionView {
  id: string;
  status: string;
  dailyRoomUrl: string | null;
  mentorName: string;
  briefing: MentorBriefingOutput | PreCallBriefOutput | null;
}

export async function getBookingForSession(
  bookingId: string
): Promise<{ booking: BookingSessionView | null; forbidden: boolean }> {
  const session = await getSession();
  if (!session) {
    return { booking: null, forbidden: true };
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, status, daily_room_url, mentee_id, mentor_id, briefing_json, mentors(full_name)')
    .eq('id', bookingId)
    .single();

  if (error || !data) {
    return { booking: null, forbidden: false };
  }

  const isParticipant =
    session.userId === data.mentee_id || session.userId === data.mentor_id || session.role === 'admin';

  if (!isParticipant) {
    return { booking: null, forbidden: true };
  }

  const mentor = data.mentors as { full_name: string } | null;

  return {
    booking: {
      id: data.id,
      status: data.status,
      dailyRoomUrl: data.daily_room_url,
      mentorName: mentor?.full_name ?? 'Expert',
      briefing: (data.briefing_json as MentorBriefingOutput | PreCallBriefOutput | null) ?? null,
    },
    forbidden: false,
  };
}
