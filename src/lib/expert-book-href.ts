import { clampSessionDurationMinutes } from '@/lib/session-duration';

/** Booking entry URL for a public expert — auth redirect when unsigned. */
export function getExpertBookHref(
  slug: string,
  isSignedIn: boolean,
  durationMinutes?: number,
): string {
  let bookingPath = `/booking?mentor=${encodeURIComponent(slug)}`;
  if (durationMinutes != null) {
    bookingPath += `&duration=${clampSessionDurationMinutes(durationMinutes)}`;
  }
  if (isSignedIn) {
    return bookingPath;
  }
  return `/auth?redirect=${encodeURIComponent(bookingPath)}`;
}
