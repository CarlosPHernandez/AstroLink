import type { SessionParticipantRole } from '@/lib/booking-access';
import type { SessionData } from '@/lib/session';

export type DashboardRole = SessionData['role'] | SessionParticipantRole;

/** Role-appropriate dashboard home (no onboard redirect). */
export function getDashboardPathForRole(role: DashboardRole): string {
  if (role === 'admin') {
    return '/dashboard/admin';
  }
  if (role === 'mentor') {
    return '/dashboard/mentor';
  }
  return '/dashboard/mentee';
}

/** Post-booking return path; mentee dashboard honors `?booked=` briefing deep-link. */
export function getPostBookingDashboardPath(
  role: SessionData['role'],
  bookingId: string,
): string {
  const base = getDashboardPathForRole(role);
  if (role === 'mentee') {
    return `${base}?booked=${encodeURIComponent(bookingId)}`;
  }
  return base;
}

/** Mentor dashboard prep deep-link from confirmation email. */
export function getMentorPrepDashboardPath(bookingId: string): string {
  return `/dashboard/mentor?prep=${encodeURIComponent(bookingId)}`;
}