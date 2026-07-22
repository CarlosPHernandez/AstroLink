import { describe, expect, it } from 'vitest';
import {
  BOOKING_LEAD_TIMEZONE,
  calendarDateInTimeZone,
  getEarliestBookableDate,
  isScheduledAtOnOrAfterEarliestBookable,
  scheduledAtToCalendarDay,
} from '@/lib/booking-lead-time';

describe('booking-lead-time', () => {
  it('computes Wednesday → Friday (2 calendar-day lead)', () => {
    // 2026-07-22 15:00 ET = 19:00 UTC
    const now = new Date('2026-07-22T19:00:00.000Z');
    expect(calendarDateInTimeZone(now, BOOKING_LEAD_TIMEZONE)).toBe('2026-07-22');
    expect(getEarliestBookableDate({ now })).toBe('2026-07-24');
  });

  it('maps weekday examples from the product table', () => {
    const cases: Array<{ now: string; earliest: string }> = [
      { now: '2026-07-20T16:00:00.000Z', earliest: '2026-07-22' }, // Mon ET → Wed
      { now: '2026-07-21T16:00:00.000Z', earliest: '2026-07-23' }, // Tue → Thu
      { now: '2026-07-22T16:00:00.000Z', earliest: '2026-07-24' }, // Wed → Fri
      { now: '2026-07-23T16:00:00.000Z', earliest: '2026-07-25' }, // Thu → Sat
      { now: '2026-07-24T16:00:00.000Z', earliest: '2026-07-26' }, // Fri → Sun
    ];
    for (const { now, earliest } of cases) {
      expect(getEarliestBookableDate({ now: new Date(now) })).toBe(earliest);
    }
  });

  it('uses Eastern calendar day near UTC midnight (late-night ET)', () => {
    // 2026-07-23 03:00 UTC = 2026-07-22 23:00 EDT
    const now = new Date('2026-07-23T03:00:00.000Z');
    expect(calendarDateInTimeZone(now)).toBe('2026-07-22');
    expect(getEarliestBookableDate({ now })).toBe('2026-07-24');
  });

  it('rejects today and tomorrow; accepts day after tomorrow', () => {
    const now = new Date('2026-07-22T19:00:00.000Z');
    expect(isScheduledAtOnOrAfterEarliestBookable('2026-07-22T12:00', { now })).toBe(false);
    expect(isScheduledAtOnOrAfterEarliestBookable('2026-07-23T12:00', { now })).toBe(false);
    expect(isScheduledAtOnOrAfterEarliestBookable('2026-07-24T12:00', { now })).toBe(true);
    expect(isScheduledAtOnOrAfterEarliestBookable('2026-07-24T18:00:00.000Z', { now })).toBe(
      true,
    );
  });

  it('parses calendar day from ISO and datetime-local strings', () => {
    expect(scheduledAtToCalendarDay('2026-07-24T12:00')).toBe('2026-07-24');
    expect(scheduledAtToCalendarDay('2026-07-24T18:00:00.000Z')).toBe('2026-07-24');
    expect(scheduledAtToCalendarDay('not-a-date')).toBeNull();
  });
});
