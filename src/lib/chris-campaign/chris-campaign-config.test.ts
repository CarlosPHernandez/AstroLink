import { afterEach, describe, expect, it, vi } from 'vitest';

describe('chris-campaign-config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('defaults Chris booking to disabled', async () => {
    const { isChrisBookingEnabled } = await import('@/lib/chris-campaign/chris-campaign-config');
    expect(isChrisBookingEnabled()).toBe(false);
  });

  it('enables Chris booking when CHRIS_BOOKING_ENABLED=true', async () => {
    vi.stubEnv('CHRIS_BOOKING_ENABLED', 'true');
    const { isChrisBookingEnabled } = await import('@/lib/chris-campaign/chris-campaign-config');
    expect(isChrisBookingEnabled()).toBe(true);
  });

  it('uses default campaign id and mentor slug', async () => {
    const { getChrisCampaignId, getChrisMentorSlug, getChrisSlotCapFromEnv } = await import(
      '@/lib/chris-campaign/chris-campaign-config'
    );
    expect(getChrisCampaignId()).toBe('chris-sembroski');
    expect(getChrisMentorSlug()).toBe('chris-sembroski');
    expect(getChrisSlotCapFromEnv()).toBe(10);
  });

  it('reads overrides from env', async () => {
    vi.stubEnv('CHRIS_CAMPAIGN_ID', 'custom-campaign');
    vi.stubEnv('CHRIS_MENTOR_SLUG', 'custom-slug');
    vi.stubEnv('CHRIS_SLOT_CAP', '5');
    const { getChrisCampaignId, getChrisMentorSlug, getChrisSlotCapFromEnv } = await import(
      '@/lib/chris-campaign/chris-campaign-config'
    );
    expect(getChrisCampaignId()).toBe('custom-campaign');
    expect(getChrisMentorSlug()).toBe('custom-slug');
    expect(getChrisSlotCapFromEnv()).toBe(5);
  });

  it('recognizes campaign=chris query value', async () => {
    const { isChrisCampaignBookingQuery } = await import('@/lib/chris-campaign/chris-campaign-config');
    expect(isChrisCampaignBookingQuery('chris')).toBe(true);
    expect(isChrisCampaignBookingQuery('other')).toBe(false);
  });
});