import 'server-only';

import { supabaseAdmin } from '@/lib/supabase';
import type { MentorBriefingOutput, PreCallBriefOutput, ServiceType } from '@/lib/types';

export interface MenteeBookingView {
  id: string;
  mentorName: string;
  serviceType: ServiceType;
  scheduledAt: string;
  status: string;
  matchReason: string | null;
  dailyRoomUrl: string | null;
  briefing: MentorBriefingOutput | PreCallBriefOutput | null;
}

export async function listMenteeBookings(menteeId: string): Promise<MenteeBookingView[]> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, service_type, scheduled_at, status, match_reason, daily_room_url, briefing_json, mentors(full_name)')
    .eq('mentee_id', menteeId)
    .order('scheduled_at', { ascending: false });

  if (error || !data) {
    console.error('listMenteeBookings:', error?.message);
    return [];
  }

  return data.map((row) => {
    const mentor = row.mentors as { full_name: string } | null;
    return {
      id: row.id,
      mentorName: mentor?.full_name ?? 'Expert',
      serviceType: row.service_type as ServiceType,
      scheduledAt: row.scheduled_at,
      status: row.status,
      matchReason: row.match_reason,
      dailyRoomUrl: row.daily_room_url,
      briefing: (row.briefing_json as MentorBriefingOutput | PreCallBriefOutput | null) ?? null,
    };
  });
}
