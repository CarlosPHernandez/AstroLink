/** First month Chris sessions can be scheduled (July 7 2026 launch window onward). */
export const CHRIS_CAMPAIGN_BOOKING_START = new Date(Date.UTC(2026, 6, 7));

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

/** Bookable day tiles for a calendar month (only days on/after July 7, 2026). */
export function getChrisCampaignDatesForMonth(
  year: number,
  monthIndex: number,
): ChrisCampaignDateTile[] {
  const monthStart = utcMonthStart(year, monthIndex);
  const monthEnd = utcMonthStart(year, monthIndex + 1);
  const tiles: ChrisCampaignDateTile[] = [];

  for (
    let cursor = new Date(monthStart);
    cursor < monthEnd;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    if (cursor < CHRIS_CAMPAIGN_BOOKING_START) {
      continue;
    }
    tiles.push(toDateTile(new Date(cursor)));
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