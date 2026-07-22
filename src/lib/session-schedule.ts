/** Session schedule helpers (datetime-local ↔ wall-clock presets in America/New_York). */

import { getEarliestBookableDate } from '@/lib/booking-lead-time';

export const BOOKING_TIMEZONE_ET = 'America/New_York';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Format a Date as `YYYY-MM-DDTHH:mm` in the browser's local timezone (datetime-local). */
export function toDatetimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Parse datetime-local value into a Date (local timezone). */
export function fromDatetimeLocalValue(value: string): Date | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

type WallParts = { year: number; month: number; day: number; hour: number; minute: number };

function partsInTimeZone(date: Date, timeZone: string): WallParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const map = Object.fromEntries(
    fmt
      .formatToParts(date)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour === '24' ? '0' : map.hour),
    minute: Number(map.minute),
  };
}

/**
 * Convert a wall-clock time in `timeZone` to a UTC `Date`.
 * Iterative correction handles EST/EDT offsets without date-fns.
 */
export function dateFromZonedWallTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string = BOOKING_TIMEZONE_ET,
): Date {
  let date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  for (let i = 0; i < 4; i += 1) {
    const parts = partsInTimeZone(date, timeZone);
    const asUtcMs = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      0,
    );
    const targetMs = Date.UTC(year, month - 1, day, hour, minute, 0);
    const delta = targetMs - asUtcMs;
    if (delta === 0) break;
    date = new Date(date.getTime() + delta);
  }
  return date;
}

/** Today's calendar date parts in America/New_York. */
export function easternTodayParts(now: Date = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const p = partsInTimeZone(now, BOOKING_TIMEZONE_ET);
  return { year: p.year, month: p.month, day: p.day };
}

/**
 * datetime-local value for a wall-clock time today in America/New_York
 * (converted into the viewer's local timezone for the input).
 */
export function datetimeLocalForEasternToday(
  hour: number,
  minute: number,
  now: Date = new Date(),
): string {
  const { year, month, day } = easternTodayParts(now);
  const instant = dateFromZonedWallTime(year, month, day, hour, minute, BOOKING_TIMEZONE_ET);
  return toDatetimeLocalValue(instant);
}

export type SchedulePreset = {
  id: string;
  label: string;
  /** Eastern wall-clock hour 0–23 */
  hourEt: number;
  minuteEt: number;
};

/** Ops-friendly presets for dry-run booking (Eastern) — earliest bookable day (today+2). */
export const DEFAULT_SCHEDULE_PRESETS: SchedulePreset[] = [
  { id: 'et-1900', label: 'First open day · 7:00 PM ET', hourEt: 19, minuteEt: 0 },
  { id: 'et-1930', label: 'First open day · 7:30 PM ET', hourEt: 19, minuteEt: 30 },
  { id: 'et-2000', label: 'First open day · 8:00 PM ET', hourEt: 20, minuteEt: 0 },
  { id: 'et-1830', label: 'First open day · 6:30 PM ET', hourEt: 18, minuteEt: 30 },
];

/**
 * datetime-local value for a wall-clock time on the earliest bookable Eastern day
 * (today + 2 calendar days), converted into the viewer's local timezone.
 */
export function datetimeLocalForEarliestBookableEastern(
  hour: number,
  minute: number,
  now: Date = new Date(),
): string {
  const earliest = getEarliestBookableDate({ now, timezone: BOOKING_TIMEZONE_ET });
  const [year, month, day] = earliest.split('-').map(Number);
  const instant = dateFromZonedWallTime(year, month, day, hour, minute, BOOKING_TIMEZONE_ET);
  return toDatetimeLocalValue(instant);
}

export function formatEasternPreview(datetimeLocal: string): string | null {
  const date = fromDatetimeLocalValue(datetimeLocal);
  if (!date) return null;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: BOOKING_TIMEZONE_ET,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

export function formatLocalPreview(datetimeLocal: string): string | null {
  const date = fromDatetimeLocalValue(datetimeLocal);
  if (!date) return null;
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}
