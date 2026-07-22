import { describe, expect, it } from 'vitest';

import {
  dateFromZonedWallTime,
  datetimeLocalForEarliestBookableEastern,
  datetimeLocalForEasternToday,
  easternTodayParts,
  formatEasternPreview,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '@/lib/session-schedule';

describe('session-schedule', () => {
  it('round-trips datetime-local values', () => {
    const d = new Date(2026, 6, 20, 19, 0, 0);
    const local = toDatetimeLocalValue(d);
    expect(local).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    const back = fromDatetimeLocalValue(local);
    expect(back).not.toBeNull();
    expect(back!.getFullYear()).toBe(2026);
    expect(back!.getMonth()).toBe(6);
    expect(back!.getDate()).toBe(20);
    expect(back!.getHours()).toBe(19);
  });

  it('maps Eastern wall time to a real instant (winter EST)', () => {
    // 2026-01-15 19:00 America/New_York = 00:00 UTC next day (EST = UTC-5)
    const d = dateFromZonedWallTime(2026, 1, 15, 19, 0, 'America/New_York');
    expect(d.toISOString()).toBe('2026-01-16T00:00:00.000Z');
  });

  it('maps Eastern wall time to a real instant (summer EDT)', () => {
    // 2026-07-20 19:00 America/New_York = 23:00 UTC same day (EDT = UTC-4)
    const d = dateFromZonedWallTime(2026, 7, 20, 19, 0, 'America/New_York');
    expect(d.toISOString()).toBe('2026-07-20T23:00:00.000Z');
  });

  it('builds tonight preset as local datetime-local string', () => {
    const fixed = new Date('2026-07-20T15:00:00.000Z'); // afternoon UTC ≈ morning ET
    const local = datetimeLocalForEasternToday(19, 0, fixed);
    expect(local).toMatch(/T\d{2}:\d{2}$/);
    const preview = formatEasternPreview(local);
    expect(preview).toMatch(/7:00/);
    expect(preview).toMatch(/EDT|EST|ET/);
  });

  it('builds earliest-bookable-day preset (Wed → Fri Eastern)', () => {
    // 2026-07-22 15:00 ET = 19:00 UTC → earliest bookable Fri 24
    const fixed = new Date('2026-07-22T19:00:00.000Z');
    const local = datetimeLocalForEarliestBookableEastern(19, 0, fixed);
    const preview = formatEasternPreview(local);
    expect(preview).toMatch(/Jul 24|Jul 24/);
    expect(preview).toMatch(/7:00/);
  });

  it('easternTodayParts uses America/New_York calendar day', () => {
    // 2026-07-21 02:00 UTC is still July 20 evening ET
    const parts = easternTodayParts(new Date('2026-07-21T02:00:00.000Z'));
    expect(parts).toEqual({ year: 2026, month: 7, day: 20 });
  });
});
