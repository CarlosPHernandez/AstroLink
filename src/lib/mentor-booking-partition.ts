import { isBookingUpcoming } from '@/lib/booking-partition';
import { resolveExpertBrief } from '@/lib/briefing-display';
import type { BookingStatus, BriefingPayload, ServiceType } from '@/lib/types';

export interface MentorBookingView {
  id: string;
  menteeName: string;
  serviceType: ServiceType;
  scheduledAt: string;
  status: BookingStatus;
  matchReason: string | null;
  dailyRoomUrl: string | null;
  intakeBackground: string | null;
  briefing: BriefingPayload | null;
  durationMinutes?: number;
}

export interface PartitionedMentorBookings {
  upcoming: MentorBookingView[];
  past: MentorBookingView[];
  nextUpcoming: MentorBookingView | null;
}

function mentorBriefingContext(
  briefing: BriefingPayload | null,
  intakeBackground: string | null,
): string {
  const expert = resolveExpertBrief(briefing);
  if (expert?.mentee_context_summary) {
    return expert.mentee_context_summary;
  }
  if (briefing && 'buyer_context_summary' in briefing && briefing.buyer_context_summary) {
    return briefing.buyer_context_summary;
  }
  if (intakeBackground?.trim()) {
    return intakeBackground.trim();
  }
  return 'No pre-session context yet. Ask the buyer about their goals at the start of the call.';
}

export function getMentorBookingContextSummary(booking: MentorBookingView): string {
  return mentorBriefingContext(booking.briefing, booking.intakeBackground);
}

export function partitionMentorBookings(
  bookings: MentorBookingView[],
  now = new Date(),
): PartitionedMentorBookings {
  const upcoming: MentorBookingView[] = [];
  const past: MentorBookingView[] = [];

  for (const booking of bookings) {
    if (isBookingUpcoming(booking, now)) {
      upcoming.push(booking);
    } else {
      past.push(booking);
    }
  }

  upcoming.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  return {
    upcoming,
    past,
    nextUpcoming: upcoming[0] ?? null,
  };
}

export { isBookingUpcoming } from '@/lib/booking-partition';
