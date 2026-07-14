/** First month Chris sessions can be scheduled (July 7 2026 launch window onward). */
export const CHRIS_CAMPAIGN_BOOKING_START = new Date(Date.UTC(2026, 6, 7));

/** Calendar day for date-hold tiles / validation (Eastern Time). */
export const CHRIS_BOOKING_DATE_TIMEZONE = 'America/New_York';

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
 * Earliest bookable calendar day: max(campaign start, today Eastern).
 * Returns YYYY-MM-DD.
 */
export function getChrisMinBookableIsoDate(now: Date = new Date()): string {
  const campaignStartIso = CHRIS_CAMPAIGN_BOOKING_START.toISOString().slice(0, 10);
  const todayEastern = calendarDateInEastern(now);
  return todayEastern > campaignStartIso ? todayEastern : campaignStartIso;
}

/** True when scheduledAt (ISO or datetime-local) is on/after min bookable day. */
export function isChrisScheduledDateBookable(
  scheduledAt: string,
  now: Date = new Date(),
): boolean {
  const day = scheduledAt.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
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
 * Only days on/after campaign start and on/after today (Eastern).
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