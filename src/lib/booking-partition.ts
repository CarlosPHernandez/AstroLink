import { resolveJoinWindowEndMs } from '@/lib/join-window';
import type {
  BookingStatus,
  BriefingPayload,
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
  briefing: BriefingPayload | null;
  durationMinutes?: number; // from slider for 1:1; shown in cards + used for prorated price
  /** True when mentee already left session feedback for this booking. */
  hasSubmittedReview?: boolean;
}

export interface PartitionedMenteeBookings {
  upcoming: MenteeBookingView[];
  past: MenteeBookingView[];
  nextUpcoming: MenteeBookingView | null;
}

type BookingTimingFields = Pick<MenteeBookingView, 'status' | 'scheduledAt' | 'durationMinutes'>;

/**
 * Confirmed bookings stay "upcoming" until the call end (scheduled + duration),
 * not merely until start — so late joiners still see Join room.
 */
export function isBookingUpcoming(booking: BookingTimingFields, now = new Date()): boolean {
  if (booking.status === 'pending_payment') {
    return true;
  }
  if (booking.status === 'confirmed') {
    const scheduledMs = new Date(booking.scheduledAt).getTime();
    if (Number.isNaN(scheduledMs)) {
      return false;
    }
    const windowEnd = resolveJoinWindowEndMs(scheduledMs, booking.durationMinutes);
    return now.getTime() < windowEnd;
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
    return a.id.localeCompare(b.id);
  });

  return {
    upcoming,
    past,
    nextUpcoming: upcoming[0] ?? null,
  };
}
