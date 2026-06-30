import { CHRIS_BOOKING_CAMPAIGN_QUERY } from '@/lib/chris-campaign/chris-campaign-constants';

/** Booking path for Chris campaign sessions (includes `campaign=chris`). */
export function getChrisBookingPath(mentorSlug: string): string {
  const params = new URLSearchParams({
    mentor: mentorSlug,
    campaign: CHRIS_BOOKING_CAMPAIGN_QUERY,
  });
  return `/booking?${params.toString()}`;
}

/** Auth-aware entry URL for the Chris booking funnel. */
export function getChrisBookingEntryHref(mentorSlug: string, isSignedIn: boolean): string {
  const bookingPath = getChrisBookingPath(mentorSlug);
  if (isSignedIn) {
    return bookingPath;
  }
  return `/auth?redirect=${encodeURIComponent(bookingPath)}`;
}