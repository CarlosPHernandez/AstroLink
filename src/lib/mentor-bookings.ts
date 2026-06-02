import 'server-only';

import type { MentorBookingView } from '@/lib/mentor-booking-partition';
import { supabaseAdmin } from '@/lib/supabase';
import type {
  BookingStatus,
  MentorBriefingOutput,
  PreCallBriefOutput,
  ServiceType,
} from '@/lib/types';

export type { MentorBookingView } from '@/lib/mentor-booking-partition';
export {
  getMentorBookingContextSummary,
  partitionMentorBookings,
  isBookingUpcoming,
} from '@/lib/mentor-booking-partition';

export async function listMentorBookings(mentorId: string): Promise<MentorBookingView[]> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(
      'id, service_type, scheduled_at, status, match_reason, daily_room_url, briefing_json, intake_background, users(full_name)',
    )
    .eq('mentor_id', mentorId)
    .order('scheduled_at', { ascending: false });

  if (error || !data) {
    console.error('listMentorBookings:', error?.message);
    return [];
  }

  return data.map((row) => {
    const mentee = row.users as { full_name: string } | null;
    return {
      id: row.id,
      menteeName: mentee?.full_name ?? 'Buyer',
      serviceType: row.service_type as ServiceType,
      scheduledAt: row.scheduled_at,
      status: row.status as BookingStatus,
      matchReason: row.match_reason,
      dailyRoomUrl: row.daily_room_url,
      intakeBackground: row.intake_background,
      briefing: (row.briefing_json as MentorBriefingOutput | PreCallBriefOutput | null) ?? null,
    };
  });
}
