import { describe, expect, it } from 'vitest';
import {
  chrisCampaignDateToDatetimeLocal,
  defaultChrisScheduledAtDatetimeLocal,
  getChrisCampaignDurationMinutes,
  isChrisCampaignBookingQuery,
  resolveChrisPrefillScheduledAt,
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

  it('drops too-soon or closed-weekday ?date= prefills', () => {
    const now = new Date('2026-07-22T16:00:00Z'); // Wed
    expect(resolveChrisPrefillScheduledAt('2026-07-22', now)).toBeNull(); // today
    expect(resolveChrisPrefillScheduledAt('2026-07-23', now)).toBeNull(); // tomorrow
    expect(resolveChrisPrefillScheduledAt('2026-07-27', now)).toBeNull(); // Mon
    expect(resolveChrisPrefillScheduledAt('2026-07-24', now)).toBe('2026-07-24T12:00'); // Fri
  });

  it('defaults wizard date to earliest Chris bookable day', () => {
    const now = new Date('2026-07-22T16:00:00Z');
    expect(defaultChrisScheduledAtDatetimeLocal(now)).toBe('2026-07-24T12:00');
  });
});
