/**
 * Platform booking lead-time: earliest bookable calendar day is today + N days
 * in America/New_York (not rolling 24h windows).
 *
 * Example: if today is Wednesday Eastern, first bookable day is Friday.
 */

export const MINIMUM_BOOKING_LEAD_DAYS = 2;
export const BOOKING_LEAD_TIMEZONE = 'America/New_York';

export type EarliestBookableDateParams = {
  now?: Date;
  timezone?: string;
  leadDays?: number;
};

/** YYYY-MM-DD for `now` in the given IANA timezone. */
export function calendarDateInTimeZone(
  now: Date = new Date(),
  timeZone: string = BOOKING_LEAD_TIMEZONE,
): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function addCalendarDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Earliest bookable calendar day (YYYY-MM-DD) in the platform timezone.
 * Today and the next (leadDays - 1) days are not bookable.
 */
export function getEarliestBookableDate({
  now = new Date(),
  timezone = BOOKING_LEAD_TIMEZONE,
  leadDays = MINIMUM_BOOKING_LEAD_DAYS,
}: EarliestBookableDateParams = {}): string {
  const today = calendarDateInTimeZone(now, timezone);
  return addCalendarDaysIso(today, leadDays);
}

/** Normalize a scheduledAt string or Date to YYYY-MM-DD (first 10 chars when ISO-like). */
export function scheduledAtToCalendarDay(scheduledAt: string | Date): string | null {
  if (scheduledAt instanceof Date) {
    if (Number.isNaN(scheduledAt.getTime())) return null;
    return scheduledAt.toISOString().slice(0, 10);
  }
  const day = scheduledAt.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return null;
  }
  return day;
}

/**
 * True when the scheduled calendar day (from the timestamp string / Date, first 10
 * chars of ISO) is on or after the earliest bookable day.
 *
 * For datetime-local values without Z (e.g. "2026-07-24T12:00"), the date prefix
 * is the buyer's chosen calendar day — same convention as Chris campaign dates.
 */
export function isScheduledAtOnOrAfterEarliestBookable(
  scheduledAt: string | Date,
  params: EarliestBookableDateParams = {},
): boolean {
  const day = scheduledAtToCalendarDay(scheduledAt);
  if (!day) return false;
  return day >= getEarliestBookableDate(params);
}

export const BOOKING_LEAD_TIME_ERROR =
  'Choose a session date at least 2 days from today.';
