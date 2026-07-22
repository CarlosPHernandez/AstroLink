import { getEarliestBookableDate } from '@/lib/booking-lead-time';

/** First day Chris sessions can be scheduled (July 20 2026 onward — heads-up for Chris). */
export const CHRIS_CAMPAIGN_BOOKING_START = new Date(Date.UTC(2026, 6, 20));

/** Calendar day for date-hold tiles / validation (Eastern Time). */
export const CHRIS_BOOKING_DATE_TIMEZONE = 'America/New_York';

/**
 * Bookable weekdays for Chris date strip / validation.
 * Monday and Tuesday are intentionally closed (sessions start Wednesday).
 * Uses UTC calendar weekday for YYYY-MM-DD campaign dates.
 */
export function isChrisBookableWeekday(isoDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return false;
  }
  const weekday = new Date(`${isoDate}T12:00:00Z`).getUTCDay(); // 0=Sun … 6=Sat
  return weekday !== 1 && weekday !== 2;
}

function addUtcCalendarDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Advance YYYY-MM-DD until it lands on a bookable weekday (Wed–Sun). */
export function nextChrisBookableIsoDate(isoDate: string): string {
  let cursor = isoDate;
  for (let i = 0; i < 7; i += 1) {
    if (isChrisBookableWeekday(cursor)) {
      return cursor;
    }
    cursor = addUtcCalendarDays(cursor, 1);
  }
  return isoDate;
}

export type ChrisCampaignDateTile = {
  isoDate: string;
  month: string;
  day: string;
  weekday: string;
};

function utcMonthStart(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1));
}

function formatMonthLabel(year: number, monthIndex: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(utcMonthStart(year, monthIndex));
}

function toDateTile(date: Date): ChrisCampaignDateTile {
  const isoDate = date.toISOString().slice(0, 10);
  const month = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    timeZone: 'UTC',
  })
    .format(date)
    .replace('.', '');
  const day = String(date.getUTCDate());
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  })
    .format(date)
    .toUpperCase();

  return { isoDate, month, day, weekday };
}

/** YYYY-MM-DD for `now` in America/New_York (handles EST/EDT). */
export function calendarDateInEastern(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CHRIS_BOOKING_DATE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Earliest bookable calendar day: max(campaign start, platform earliest with 2-day lead),
 * advanced past Monday/Tuesday when needed.
 * Returns YYYY-MM-DD.
 *
 * Platform lead: today and tomorrow are never bookable (America/New_York).
 * Example: Wednesday → earliest raw Friday, then next Wed–Sun if needed.
 */
export function getChrisMinBookableIsoDate(now: Date = new Date()): string {
  const campaignStartIso = CHRIS_CAMPAIGN_BOOKING_START.toISOString().slice(0, 10);
  const earliestLead = getEarliestBookableDate({
    now,
    timezone: CHRIS_BOOKING_DATE_TIMEZONE,
  });
  const raw = earliestLead > campaignStartIso ? earliestLead : campaignStartIso;
  return nextChrisBookableIsoDate(raw);
}

/** True when scheduledAt is on/after min bookable day and not Mon/Tue. */
export function isChrisScheduledDateBookable(
  scheduledAt: string,
  now: Date = new Date(),
): boolean {
  const day = scheduledAt.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return false;
  }
  if (!isChrisBookableWeekday(day)) {
    return false;
  }
  return day >= getChrisMinBookableIsoDate(now);
}

/** Months navigable in the landing date strip (start month + forward horizon). */
export function getChrisCampaignBookingMonthCount(horizonMonths = 12): number {
  return Math.max(1, horizonMonths);
}

export function getChrisCampaignBookingStartMonth(): { year: number; monthIndex: number } {
  return {
    year: CHRIS_CAMPAIGN_BOOKING_START.getUTCFullYear(),
    monthIndex: CHRIS_CAMPAIGN_BOOKING_START.getUTCMonth(),
  };
}

/** Default month shown on load: July 2026, or current month if already past start. */
export function getChrisCampaignInitialMonth(now = new Date()): { year: number; monthIndex: number } {
  const start = getChrisCampaignBookingStartMonth();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const beforeStart =
    currentYear < start.year ||
    (currentYear === start.year && currentMonth < start.monthIndex);

  if (beforeStart) {
    return start;
  }

  return { year: currentYear, monthIndex: currentMonth };
}

export function getChrisCampaignMonthLabel(year: number, monthIndex: number): string {
  return formatMonthLabel(year, monthIndex);
}

/**
 * Bookable day tiles for a calendar month.
 * Only days on/after campaign start, on/after platform earliest (today+2 Eastern),
 * and Wed–Sun.
 */
export function getChrisCampaignDatesForMonth(
  year: number,
  monthIndex: number,
  now: Date = new Date(),
): ChrisCampaignDateTile[] {
  const monthStart = utcMonthStart(year, monthIndex);
  const monthEnd = utcMonthStart(year, monthIndex + 1);
  const tiles: ChrisCampaignDateTile[] = [];
  const minIso = getChrisMinBookableIsoDate(now);

  for (
    let cursor = new Date(monthStart);
    cursor < monthEnd;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    if (cursor < CHRIS_CAMPAIGN_BOOKING_START) {
      continue;
    }
    const tile = toDateTile(new Date(cursor));
    if (tile.isoDate < minIso) {
      continue;
    }
    if (!isChrisBookableWeekday(tile.isoDate)) {
      continue;
    }
    tiles.push(tile);
  }

  return tiles;
}

export function canNavigateChrisCampaignMonthEarlier(
  year: number,
  monthIndex: number,
): boolean {
  const start = getChrisCampaignBookingStartMonth();
  return year > start.year || (year === start.year && monthIndex > start.monthIndex);
}

export function canNavigateChrisCampaignMonthLater(
  year: number,
  monthIndex: number,
  horizonMonths = 12,
): boolean {
  const start = getChrisCampaignBookingStartMonth();
  const startAbsolute = start.year * 12 + start.monthIndex;
  const currentAbsolute = year * 12 + monthIndex;
  const lastAbsolute = startAbsolute + getChrisCampaignBookingMonthCount(horizonMonths) - 1;
  return currentAbsolute < lastAbsolute;
}

export function shiftChrisCampaignMonth(
  year: number,
  monthIndex: number,
  delta: number,
): { year: number; monthIndex: number } {
  const absolute = year * 12 + monthIndex + delta;
  return {
    year: Math.floor(absolute / 12),
    monthIndex: absolute % 12,
  };
}