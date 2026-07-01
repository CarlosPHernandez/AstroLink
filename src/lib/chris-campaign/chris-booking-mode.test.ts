import { describe, expect, it } from 'vitest';
import {
  chrisCampaignDateToDatetimeLocal,
  getChrisCampaignDurationMinutes,
  isChrisCampaignBookingQuery,
} from '@/lib/chris-campaign/chris-booking-mode';

describe('chris-booking-mode', () => {
  it('detects campaign=chris query', () => {
    expect(isChrisCampaignBookingQuery('chris')).toBe(true);
    expect(isChrisCampaignBookingQuery('other')).toBe(false);
    expect(isChrisCampaignBookingQuery(undefined)).toBe(false);
  });

  it('returns fixed 45-minute duration', () => {
    expect(getChrisCampaignDurationMinutes()).toBe(45);
  });

  it('converts ISO date to datetime-local prefill', () => {
    expect(chrisCampaignDateToDatetimeLocal('2026-07-15')).toBe('2026-07-15T12:00');
    expect(chrisCampaignDateToDatetimeLocal('invalid')).toBeNull();
  });
});