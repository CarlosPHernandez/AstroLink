import {
  CHRIS_BOOKING_CAMPAIGN_QUERY,
  CHRIS_SESSION_DURATION_MINUTES,
} from '@/lib/chris-campaign/chris-campaign-constants';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Default local time prefill when landing passes a campaign date (noon).
 *  Time selection is day-only for the current request/approval flow (see plan).
 *  Chris days start 2026-07-07.
 */
export function chrisCampaignDateToDatetimeLocal(isoDate: string): string | null {
  if (!ISO_DATE_PATTERN.test(isoDate)) {
    return null;
  }
  return `${isoDate}T12:00`;
}

export function isChrisCampaignBookingQuery(
  campaign: string | null | undefined,
): campaign is typeof CHRIS_BOOKING_CAMPAIGN_QUERY {
  return campaign === CHRIS_BOOKING_CAMPAIGN_QUERY;
}

export function getChrisCampaignDurationMinutes(): number {
  return CHRIS_SESSION_DURATION_MINUTES;
}