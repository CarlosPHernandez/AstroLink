/**
 * Generate bookable 45-minute starts inside Chris open blocks (ops concierge).
 * Wall times are America/Los_Angeles; storage uses UTC ISO.
 *
 * Duration is inlined (not imported) so the ops CLI can load this file under
 * `node --experimental-strip-types` without path-alias resolution.
 * Keep in sync with CHRIS_SESSION_DURATION_MINUTES in chris-campaign-constants.ts.
 */

/** Keep in sync with `CHRIS_SESSION_DURATION_MINUTES`. */
export const CHRIS_SLOT_DURATION_MINUTES = 45;

export const CHRIS_SLOT_TIME_ZONE = 'America/Los_Angeles';

export type ChrisDayKey = 'tue' | 'thu' | 'fri';

export type ChrisAvailabilityBlock = {
  dayKey: ChrisDayKey;
  /** Calendar date YYYY-MM-DD in America/Los_Angeles. */
  isoDate: string;
  /** Inclusive block start (local hour 0–23). */
  startHour: number;
  startMinute: number;
  /** Exclusive block end (local). Session must end at or before this. */
  endHour: number;
  endMinute: number;
};

export type ChrisSlotOffer = {
  dayKey: ChrisDayKey;
  isoDate: string;
  /** UTC ISO start of the 45-min session. */
  startUtcIso: string;
  /** UTC ISO end (start + 45m). */
  endUtcIso: string;
  /** Human label in PDT/PST, e.g. "Tue, Jul 22 · 1:30–2:15 PM PDT". */
  label: string;
  /** Short time range only, e.g. "1:30–2:15 PM". */
  timeRangeLabel: string;
};

export const DEFAULT_CHRIS_BLOCK_HOURS: Record<
  ChrisDayKey,
  { startHour: number; startMinute: number; endHour: number; endMinute: number }
> = {
  tue: { startHour: 12, startMinute: 0, endHour: 16, endMinute: 0 },
  thu: { startHour: 13, startMinute: 0, endHour: 21, endMinute: 0 },
  fri: { startHour: 12, startMinute: 0, endHour: 21, endMinute: 0 },
};

export const CHRIS_DAY_KEY_LABEL: Record<ChrisDayKey, string> = {
  tue: 'Tuesday',
  thu: 'Thursday',
  fri: 'Friday',
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isChrisDayKey(value: string): value is ChrisDayKey {
  return value === 'tue' || value === 'thu' || value === 'fri';
}

export function isIsoDateString(value: string): boolean {
  return ISO_DATE.test(value);
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/**
 * Convert a wall-clock local time in `timeZone` to a UTC Date.
 */
export function wallTimeInTimeZoneToUtc(
  isoDate: string,
  hour: number,
  minute: number,
  timeZone: string = CHRIS_SLOT_TIME_ZONE,
): Date {
  if (!isIsoDateString(isoDate)) {
    throw new Error(`Invalid isoDate: ${isoDate}`);
  }
  const [year, month, day] = isoDate.split('-').map(Number);
  const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let guess = desiredAsUtc;
  for (let i = 0; i < 4; i++) {
    const parts = getZonedParts(new Date(guess), timeZone);
    const asIfUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const delta = desiredAsUtc - asIfUtc;
    guess += delta;
    if (delta === 0) break;
  }
  return new Date(guess);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function formatTimeRangeLabel(start: Date, end: Date, timeZone: string): string {
  const startFmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const endFmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  // Strip spaces around en-dash for compact UI
  const startLabel = startFmt.format(start).replace(/\u202f/g, ' ');
  const endLabel = endFmt.format(end).replace(/\u202f/g, ' ');
  return `${startLabel}–${endLabel}`;
}

function formatSlotLabel(start: Date, end: Date, timeZone: string): string {
  const dayFmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const tzFmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'short',
  });
  const dayPart = dayFmt.format(start);
  const tzParts = tzFmt.formatToParts(start);
  const tzName = tzParts.find((p) => p.type === 'timeZoneName')?.value ?? 'PT';
  const range = formatTimeRangeLabel(start, end, timeZone);
  return `${dayPart} · ${range} ${tzName}`;
}

export function buildBlockDaySummary(block: ChrisAvailabilityBlock): string {
  const start = wallTimeInTimeZoneToUtc(
    block.isoDate,
    block.startHour,
    block.startMinute,
  );
  const end = wallTimeInTimeZoneToUtc(block.isoDate, block.endHour, block.endMinute);
  const dayName = CHRIS_DAY_KEY_LABEL[block.dayKey];
  const dayFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: CHRIS_SLOT_TIME_ZONE,
    month: 'short',
    day: 'numeric',
  });
  const range = formatTimeRangeLabel(start, end, CHRIS_SLOT_TIME_ZONE);
  const tzFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: CHRIS_SLOT_TIME_ZONE,
    timeZoneName: 'short',
  });
  const tzName =
    tzFmt.formatToParts(start).find((p) => p.type === 'timeZoneName')?.value ?? 'PT';
  return `${dayName}, ${dayFmt.format(start)} · ${range} ${tzName}`;
}

/**
 * 45-minute starts fully contained in [block start, block end].
 */
export function generateSlotsForBlock(
  block: ChrisAvailabilityBlock,
  durationMinutes: number = CHRIS_SLOT_DURATION_MINUTES,
): ChrisSlotOffer[] {
  if (durationMinutes <= 0) {
    throw new Error('durationMinutes must be positive');
  }

  const blockStart = wallTimeInTimeZoneToUtc(
    block.isoDate,
    block.startHour,
    block.startMinute,
  );
  const blockEnd = wallTimeInTimeZoneToUtc(
    block.isoDate,
    block.endHour,
    block.endMinute,
  );

  const slots: ChrisSlotOffer[] = [];
  let cursor = blockStart;
  while (addMinutes(cursor, durationMinutes).getTime() <= blockEnd.getTime()) {
    const end = addMinutes(cursor, durationMinutes);
    slots.push({
      dayKey: block.dayKey,
      isoDate: block.isoDate,
      startUtcIso: cursor.toISOString(),
      endUtcIso: end.toISOString(),
      label: formatSlotLabel(cursor, end, CHRIS_SLOT_TIME_ZONE),
      timeRangeLabel: formatTimeRangeLabel(cursor, end, CHRIS_SLOT_TIME_ZONE),
    });
    cursor = addMinutes(cursor, durationMinutes);
  }
  return slots;
}

export function generateSlotsForBlocks(
  blocks: ChrisAvailabilityBlock[],
  durationMinutes: number = CHRIS_SLOT_DURATION_MINUTES,
): ChrisSlotOffer[] {
  return blocks.flatMap((block) => generateSlotsForBlock(block, durationMinutes));
}

export function buildDefaultBlocks(dates: {
  tue: string;
  thu: string;
  fri: string;
}): ChrisAvailabilityBlock[] {
  return (['tue', 'thu', 'fri'] as const).map((dayKey) => ({
    dayKey,
    isoDate: dates[dayKey],
    ...DEFAULT_CHRIS_BLOCK_HOURS[dayKey],
  }));
}

export function findSlotByStartUtc(
  slots: ChrisSlotOffer[],
  startUtcIso: string,
): ChrisSlotOffer | undefined {
  const target = new Date(startUtcIso).getTime();
  if (!Number.isFinite(target)) return undefined;
  return slots.find((s) => new Date(s.startUtcIso).getTime() === target);
}
