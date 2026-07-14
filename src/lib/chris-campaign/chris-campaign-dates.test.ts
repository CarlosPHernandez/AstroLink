import { describe, expect, it } from 'vitest';
import {
  canNavigateChrisCampaignMonthEarlier,
  canNavigateChrisCampaignMonthLater,
  getChrisCampaignBookingStartMonth,
  getChrisCampaignDatesForMonth,
  getChrisCampaignInitialMonth,
  getChrisCampaignMonthLabel,
  getChrisMinBookableIsoDate,
  isChrisScheduledDateBookable,
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

  it('lists July 2026 dates from the 20th onward when today is before campaign start', () => {
    const tiles = getChrisCampaignDatesForMonth(2026, 6, new Date('2026-07-01T12:00:00Z'));
    expect(tiles[0]).toMatchObject({ isoDate: '2026-07-20', day: '20', weekday: 'MON' });
    expect(tiles.at(-1)?.isoDate).toBe('2026-07-31');
    expect(tiles).toHaveLength(12);
  });

  it('excludes days before July 20 when today is mid-July 2026', () => {
    // Before July 20 campaign start, min is still 2026-07-20
    const tiles = getChrisCampaignDatesForMonth(2026, 6, new Date('2026-07-14T16:00:00Z'));
    expect(tiles[0]?.isoDate).toBe('2026-07-20');
    expect(tiles.some((t) => t.isoDate === '2026-07-19')).toBe(false);
    expect(tiles.at(-1)?.isoDate).toBe('2026-07-31');
  });

  it('uses today when after campaign start', () => {
    const tiles = getChrisCampaignDatesForMonth(2026, 6, new Date('2026-07-22T16:00:00Z'));
    expect(tiles[0]?.isoDate).toBe('2026-07-22');
    expect(tiles.some((t) => t.isoDate === '2026-07-21')).toBe(false);
  });

  it('blocks months before July 2026', () => {
    expect(getChrisCampaignDatesForMonth(2026, 5, new Date('2026-07-14T16:00:00Z'))).toHaveLength(
      0,
    );
  });

  it('computes min bookable as max(campaign start July 20, today Eastern)', () => {
    expect(getChrisMinBookableIsoDate(new Date('2026-07-01T12:00:00Z'))).toBe('2026-07-20');
    expect(getChrisMinBookableIsoDate(new Date('2026-07-14T16:00:00Z'))).toBe('2026-07-20');
    expect(getChrisMinBookableIsoDate(new Date('2026-07-22T16:00:00Z'))).toBe('2026-07-22');
  });

  it('validates scheduled dates against min bookable day', () => {
    const now = new Date('2026-07-14T16:00:00Z');
    expect(isChrisScheduledDateBookable('2026-07-14T12:00', now)).toBe(false);
    expect(isChrisScheduledDateBookable('2026-07-19T12:00', now)).toBe(false);
    expect(isChrisScheduledDateBookable('2026-07-20T12:00', now)).toBe(true);
    expect(isChrisScheduledDateBookable('2026-07-25T18:00:00.000Z', now)).toBe(true);
    expect(isChrisScheduledDateBookable('not-a-date', now)).toBe(false);
  });

  it('navigates months within the allowed horizon', () => {
    expect(canNavigateChrisCampaignMonthEarlier(2026, 6)).toBe(false);
    expect(canNavigateChrisCampaignMonthEarlier(2026, 7)).toBe(true);
    expect(canNavigateChrisCampaignMonthLater(2026, 6, 12)).toBe(true);
    expect(shiftChrisCampaignMonth(2026, 6, 1)).toEqual({ year: 2026, monthIndex: 7 });
  });
});
