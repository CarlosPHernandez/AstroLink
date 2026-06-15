import type {
  BookingStatus,
  MentorBriefingOutput,
  PreCallBriefOutput,
  ServiceType,
} from '@/lib/types';

export interface MenteeBookingView {
  id: string;
  mentorName: string;
  serviceType: ServiceType;
  scheduledAt: string;
  status: BookingStatus;
  matchReason: string | null;
  dailyRoomUrl: string | null;
  briefing: MentorBriefingOutput | PreCallBriefOutput | null;
  durationMinutes?: number; // from slider for 1:1; shown in cards + used for prorated price
}

export interface PartitionedMenteeBookings {
  upcoming: MenteeBookingView[];
  past: MenteeBookingView[];
  nextUpcoming: MenteeBookingView | null;
}

type BookingTimingFields = Pick<MenteeBookingView, 'status' | 'scheduledAt'>;

export function isBookingUpcoming(booking: BookingTimingFields, now = new Date()): boolean {
  if (booking.status === 'pending_payment') {
    return true;
  }
  if (booking.status === 'confirmed') {
    return new Date(booking.scheduledAt) >= now;
  }
  return false;
}

export function partitionMenteeBookings(
  bookings: MenteeBookingView[],
  now = new Date(),
): PartitionedMenteeBookings {
  const upcoming: MenteeBookingView[] = [];
  const past: MenteeBookingView[] = [];

  for (const booking of bookings) {
    if (isBookingUpcoming(booking, now)) {
      upcoming.push(booking);
    } else {
      past.push(booking);
    }
  }

  upcoming.sort((a, b) => {
    const ta = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    if (ta !== 0) return ta;
    // Stable/deterministic for equal times (e.g. just-booked vs others); newer id tends to sort later but predictable.
    return a.id.localeCompare(b.id);
  });

  return {
    upcoming,
    past,
    nextUpcoming: upcoming[0] ?? null,
  };
}
