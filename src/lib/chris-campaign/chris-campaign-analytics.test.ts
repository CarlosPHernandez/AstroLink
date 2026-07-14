import { describe, expect, it, vi, beforeEach } from 'vitest';

const track = vi.fn();

vi.mock('@vercel/analytics', () => ({
  track: (...args: unknown[]) => track(...args),
}));

import {
  sanitizeChrisCampaignRef,
  trackChrisLandingView,
  trackChrisRequestSession,
} from './chris-campaign-analytics';

describe('sanitizeChrisCampaignRef', () => {
  it('maps empty to direct', () => {
    expect(sanitizeChrisCampaignRef(null)).toBe('direct');
    expect(sanitizeChrisCampaignRef(undefined)).toBe('direct');
    expect(sanitizeChrisCampaignRef('')).toBe('direct');
  });

  it('preserves known campaign refs', () => {
    expect(sanitizeChrisCampaignRef('early-signups')).toBe('early-signups');
    expect(sanitizeChrisCampaignRef('chris-social')).toBe('chris-social');
    expect(sanitizeChrisCampaignRef('chris-sembroski')).toBe('chris-sembroski');
  });
});

describe('trackChrisLandingView', () => {
  beforeEach(() => {
    track.mockClear();
  });

  it('emits chris_landing_view with sanitized ref', () => {
    trackChrisLandingView('early-signups');
    expect(track).toHaveBeenCalledWith('chris_landing_view', { ref: 'early-signups' });

    trackChrisLandingView(null);
    expect(track).toHaveBeenCalledWith('chris_landing_view', { ref: 'direct' });
  });
});

describe('trackChrisRequestSession', () => {
  beforeEach(() => {
    track.mockClear();
  });

  it('emits chris_request_session with sanitized ref', () => {
    trackChrisRequestSession('chris-social');
    expect(track).toHaveBeenCalledWith('chris_request_session', { ref: 'chris-social' });
  });
});
