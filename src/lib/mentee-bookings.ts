import 'server-only';

import type { MenteeBookingView, PartitionedMenteeBookings } from '@/lib/booking-partition';
import { supabaseAdmin } from '@/lib/supabase';
import type { BriefingPayload } from '@/lib/types';

export type { MenteeBookingView, PartitionedMenteeBookings };
export { isBookingUpcoming, partitionMenteeBookings } from '@/lib/booking-partition';

export async function listMenteeBookings(menteeId: string): Promise<MenteeBookingView[]> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, service_type, scheduled_at, status, match_reason, daily_room_url, briefing_json, duration_minutes, mentors(full_name)')
    .eq('mentee_id', menteeId)
    .order('scheduled_at', { ascending: false });

  if (error || !data) {
    console.error('listMenteeBookings:', error?.message);
    return [];
  }

  const bookingIds = data.map((row) => row.id as string);
  const reviewedBookingIds = new Set<string>();

  if (bookingIds.length > 0) {
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('expert_reviews')
      .select('booking_id')
      .eq('reviewer_user_id', menteeId)
      .in('booking_id', bookingIds);

    if (reviewsError) {
      console.error('listMenteeBookings reviews:', reviewsError.message);
    } else {
      for (const row of reviews ?? []) {
        const bookingId = (row as { booking_id: string | null }).booking_id;
        if (bookingId) reviewedBookingIds.add(bookingId);
      }
    }
  }

  return data.map((row) => {
    const mentor = row.mentors as { full_name: string } | null;
    return {
      id: row.id,
      mentorName: mentor?.full_name ?? 'Expert',
      serviceType: row.service_type,
      scheduledAt: row.scheduled_at,
      status: row.status,
      matchReason: row.match_reason,
      dailyRoomUrl: row.daily_room_url,
      briefing: (row.briefing_json as BriefingPayload | null) ?? null,
      durationMinutes: row.duration_minutes ?? undefined,
      hasSubmittedReview: reviewedBookingIds.has(row.id),
    };
  });
}
