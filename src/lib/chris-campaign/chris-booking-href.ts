import { CHRIS_BOOKING_CAMPAIGN_QUERY } from '@/lib/chris-campaign/chris-campaign-constants';

export type ChrisBookingHrefOptions = {
  /** ISO date (YYYY-MM-DD) from landing date strip — pre-fills booking schedule. */
  date?: string | null;
};

/** Booking path for Chris campaign sessions (includes `campaign=chris`). */
export function getChrisBookingPath(
  mentorSlug: string,
  options?: ChrisBookingHrefOptions,
): string {
  const params = new URLSearchParams({
    mentor: mentorSlug,
    campaign: CHRIS_BOOKING_CAMPAIGN_QUERY,
  });
  const date = options?.date?.trim();
  if (date) {
    params.set('date', date);
  }
  return `/booking?${params.toString()}`;
}

/** Auth-aware entry URL for the Chris booking funnel. */
export function getChrisBookingEntryHref(
  mentorSlug: string,
  isSignedIn: boolean,
  options?: ChrisBookingHrefOptions,
): string {
  const bookingPath = getChrisBookingPath(mentorSlug, options);
  if (isSignedIn) {
    return bookingPath;
  }
  return `/auth?redirect=${encodeURIComponent(bookingPath)}`;
}