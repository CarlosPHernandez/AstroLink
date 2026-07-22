import { describe, expect, it } from 'vitest';
import {
  canNavigateChrisCampaignMonthEarlier,
  canNavigateChrisCampaignMonthLater,
  getChrisCampaignBookingStartMonth,
  getChrisCampaignDatesForMonth,
  getChrisCampaignInitialMonth,
  getChrisCampaignMonthLabel,
  getChrisMinBookableIsoDate,
  isChrisBookableWeekday,
  isChrisScheduledDateBookable,
  nextChrisBookableIsoDate,
  shiftChrisCampaignMonth,
} from '@/lib/chris-campaign/chris-campaign-dates';

describe('chris-campaign-dates', () => {
  it('starts booking window in July 2026', () => {
    expect(getChrisCampaignBookingStartMonth()).toEqual({ year: 2026, monthIndex: 6 });
    expect(getChrisCampaignMonthLabel(2026, 6)).toBe('July 2026');
  });

  it('defaults to July 2026 before the launch month', () => {
    expect(getChrisCampaignInitialMonth(new Date('2026-06-30T12:00:00Z'))).toEqual({
      year: 2026,
      monthIndex: 6,
    });
  });

  it('defaults to the current month after July 2026 begins', () => {
    expect(getChrisCampaignInitialMonth(new Date('2026-08-15T12:00:00Z'))).toEqual({
      year: 2026,
      monthIndex: 7,
    });
  });

  it('treats Mon/Tue as closed and advances to Wednesday', () => {
    expect(isChrisBookableWeekday('2026-07-20')).toBe(false); // Mon
    expect(isChrisBookableWeekday('2026-07-21')).toBe(false); // Tue
    expect(isChrisBookableWeekday('2026-07-22')).toBe(true); // Wed
    expect(nextChrisBookableIsoDate('2026-07-20')).toBe('2026-07-22');
    expect(nextChrisBookableIsoDate('2026-07-22')).toBe('2026-07-22');
  });

  it('lists July 2026 dates from Wednesday the 22nd when today is before campaign start', () => {
    const tiles = getChrisCampaignDatesForMonth(2026, 6, new Date('2026-07-01T12:00:00Z'));
    expect(tiles[0]).toMatchObject({ isoDate: '2026-07-22', day: '22', weekday: 'WED' });
    expect(tiles.some((t) => t.weekday === 'MON' || t.weekday === 'TUE')).toBe(false);
    expect(tiles.at(-1)?.isoDate).toBe('2026-07-31'); // Fri
    // Jul 22–31 excluding Mon 27 / Tue 28 → 8 days
    expect(tiles).toHaveLength(8);
  });

  it('excludes days before min bookable and never includes Mon/Tue', () => {
    const tiles = getChrisCampaignDatesForMonth(2026, 6, new Date('2026-07-14T16:00:00Z'));
    expect(tiles[0]?.isoDate).toBe('2026-07-22');
    expect(tiles.some((t) => t.isoDate === '2026-07-20')).toBe(false);
    expect(tiles.some((t) => t.isoDate === '2026-07-21')).toBe(false);
    expect(tiles.at(-1)?.isoDate).toBe('2026-07-31');
  });

  it('uses today+2 when after campaign start (Wed → Fri lead)', () => {
    // 2026-07-22 Wed Eastern → earliest Fri 24
    const tiles = getChrisCampaignDatesForMonth(2026, 6, new Date('2026-07-22T16:00:00Z'));
    expect(tiles[0]?.isoDate).toBe('2026-07-24');
    expect(tiles.some((t) => t.isoDate === '2026-07-22')).toBe(false);
    expect(tiles.some((t) => t.isoDate === '2026-07-23')).toBe(false);
  });

  it('skips to Wednesday when lead day lands on Mon/Tue after campaign start', () => {
    // 2026-07-27 is Monday; +2 lead = Wed 29 (already bookable weekday)
    expect(getChrisMinBookableIsoDate(new Date('2026-07-27T16:00:00Z'))).toBe('2026-07-29');
    const tiles = getChrisCampaignDatesForMonth(2026, 6, new Date('2026-07-27T16:00:00Z'));
    expect(tiles[0]?.isoDate).toBe('2026-07-29');
  });

  it('advances past Tuesday when Sunday + 2-day lead lands on Tuesday', () => {
    // 2026-07-26 Sunday ET; lead = Tue 28 → next Wed 29
    expect(getChrisMinBookableIsoDate(new Date('2026-07-26T16:00:00Z'))).toBe('2026-07-29');
  });

  it('blocks months before July 2026', () => {
    expect(getChrisCampaignDatesForMonth(2026, 5, new Date('2026-07-14T16:00:00Z'))).toHaveLength(
      0,
    );
  });

  it('computes min bookable as max(campaign start, today+2 Eastern) then next Wed–Sun', () => {
    expect(getChrisMinBookableIsoDate(new Date('2026-07-01T12:00:00Z'))).toBe('2026-07-22');
    expect(getChrisMinBookableIsoDate(new Date('2026-07-14T16:00:00Z'))).toBe('2026-07-22');
    // Wed 22 → lead Fri 24
    expect(getChrisMinBookableIsoDate(new Date('2026-07-22T16:00:00Z'))).toBe('2026-07-24');
  });

  it('validates scheduled dates against min bookable day and weekday', () => {
    // Before campaign window dominates: min remains Wed 22
    const now = new Date('2026-07-14T16:00:00Z');
    expect(isChrisScheduledDateBookable('2026-07-14T12:00', now)).toBe(false);
    expect(isChrisScheduledDateBookable('2026-07-19T12:00', now)).toBe(false);
    expect(isChrisScheduledDateBookable('2026-07-20T12:00', now)).toBe(false); // Mon
    expect(isChrisScheduledDateBookable('2026-07-21T12:00', now)).toBe(false); // Tue
    expect(isChrisScheduledDateBookable('2026-07-22T12:00', now)).toBe(true); // Wed
    expect(isChrisScheduledDateBookable('2026-07-25T18:00:00.000Z', now)).toBe(true);
    expect(isChrisScheduledDateBookable('not-a-date', now)).toBe(false);

    // After campaign start: Wed 22 now → earliest Fri 24
    const afterStart = new Date('2026-07-22T16:00:00Z');
    expect(isChrisScheduledDateBookable('2026-07-22T12:00', afterStart)).toBe(false);
    expect(isChrisScheduledDateBookable('2026-07-23T12:00', afterStart)).toBe(false);
    expect(isChrisScheduledDateBookable('2026-07-24T12:00', afterStart)).toBe(true);
  });

  it('navigates months within the allowed horizon', () => {
    expect(canNavigateChrisCampaignMonthEarlier(2026, 6)).toBe(false);
    expect(canNavigateChrisCampaignMonthEarlier(2026, 7)).toBe(true);
    expect(canNavigateChrisCampaignMonthLater(2026, 6, 12)).toBe(true);
    expect(shiftChrisCampaignMonth(2026, 6, 1)).toEqual({ year: 2026, monthIndex: 7 });
  });
});
