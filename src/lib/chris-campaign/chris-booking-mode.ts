import { isScheduledAtOnOrAfterEarliestBookable } from '@/lib/booking-lead-time';
import {
  CHRIS_BOOKING_CAMPAIGN_QUERY,
  CHRIS_SESSION_DURATION_MINUTES,
} from '@/lib/chris-campaign/chris-campaign-constants';
import {
  getChrisMinBookableIsoDate,
  isChrisBookableWeekday,
} from '@/lib/chris-campaign/chris-campaign-dates';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Default local time prefill when landing passes a campaign date (noon).
 *  Time selection is day-only for the current request/approval flow (see plan).
 *  Bookable weekdays are Wed–Sun (see chris-campaign-dates).
 */
export function chrisCampaignDateToDatetimeLocal(isoDate: string): string | null {
  if (!ISO_DATE_PATTERN.test(isoDate)) {
    return null;
  }
  return `${isoDate}T12:00`;
}

/**
 * Prefill for ?date= only when the day meets 2-day lead + Chris Wed–Sun rules.
 * Invalid / too-soon dates return null so the wizard does not show a doomed day.
 */
export function resolveChrisPrefillScheduledAt(
  isoDate: string | null | undefined,
  now: Date = new Date(),
): string | null {
  const day = isoDate?.trim() ?? '';
  if (!ISO_DATE_PATTERN.test(day)) {
    return null;
  }
  if (!isChrisBookableWeekday(day)) {
    return null;
  }
  if (!isScheduledAtOnOrAfterEarliestBookable(day, { now })) {
    return null;
  }
  if (day < getChrisMinBookableIsoDate(now)) {
    return null;
  }
  return chrisCampaignDateToDatetimeLocal(day);
}

/** Default wizard scheduledAt: earliest Chris-bookable day at noon (datetime-local). */
export function defaultChrisScheduledAtDatetimeLocal(now: Date = new Date()): string {
  return `${getChrisMinBookableIsoDate(now)}T12:00`;
}

export function isChrisCampaignBookingQuery(
  campaign: string | null | undefined,
): campaign is typeof CHRIS_BOOKING_CAMPAIGN_QUERY {
  return campaign === CHRIS_BOOKING_CAMPAIGN_QUERY;
}

export function getChrisCampaignDurationMinutes(): number {
  return CHRIS_SESSION_DURATION_MINUTES;
}