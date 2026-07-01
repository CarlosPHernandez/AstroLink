import { CHRIS_BOOKING_CAMPAIGN_QUERY } from '@/lib/chris-campaign/chris-campaign-constants';

export type ChrisBookingHrefOptions = {
  /** ISO date (YYYY-MM-DD) from landing date strip — pre-fills booking schedule. */
  date?: string | null;
  /** Marketing referrer from `?ref=` on the Chris landing URL. */
  ref?: string | null;
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
  const ref = options?.ref?.trim();
  if (ref) {
    params.set('ref', ref);
  }
  return `/booking?${params.toString()}`;
}

/** Direct booking path for Chris campaign — wizard handles inline auth. */
export function getChrisBookingEntryHref(
  mentorSlug: string,
  _isSignedIn: boolean,
  options?: ChrisBookingHrefOptions,
): string {
  return getChrisBookingPath(mentorSlug, options);
}