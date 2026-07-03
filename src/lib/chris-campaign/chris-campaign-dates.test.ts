import { describe, expect, it } from 'vitest';
import {
  canNavigateChrisCampaignMonthEarlier,
  canNavigateChrisCampaignMonthLater,
  getChrisCampaignBookingStartMonth,
  getChrisCampaignDatesForMonth,
  getChrisCampaignInitialMonth,
  getChrisCampaignMonthLabel,
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

  it('lists July 2026 dates from the 7th onward', () => {
    const tiles = getChrisCampaignDatesForMonth(2026, 6);
    expect(tiles[0]).toMatchObject({ isoDate: '2026-07-07', day: '7', weekday: 'TUE' });
    expect(tiles.at(-1)?.isoDate).toBe('2026-07-31');
    expect(tiles).toHaveLength(25);
  });

  it('blocks months before July 2026', () => {
    expect(getChrisCampaignDatesForMonth(2026, 5)).toHaveLength(0);
  });

  it('navigates months within the allowed horizon', () => {
    expect(canNavigateChrisCampaignMonthEarlier(2026, 6)).toBe(false);
    expect(canNavigateChrisCampaignMonthEarlier(2026, 7)).toBe(true);
    expect(canNavigateChrisCampaignMonthLater(2026, 6, 12)).toBe(true);
    expect(shiftChrisCampaignMonth(2026, 6, 1)).toEqual({ year: 2026, monthIndex: 7 });
  });
});