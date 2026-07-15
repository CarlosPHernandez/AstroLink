import { describe, expect, it, vi, beforeEach } from 'vitest';

const track = vi.fn();

vi.mock('@vercel/analytics', () => ({
  track: (...args: unknown[]) => track(...args),
}));

import {
  buildChrisAnalyticsContext,
  resolveChrisWizardExitOutcome,
  sanitizeChrisCampaignRef,
  trackChrisAuthSuccess,
  trackChrisBookingPageView,
  trackChrisCheckoutStart,
  trackChrisCheckoutSuccess,
  trackChrisLandingView,
  trackChrisPaymentError,
  trackChrisRequestSession,
  trackChrisSessionContinue,
  trackChrisWizardExit,
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

describe('buildChrisAnalyticsContext', () => {
  it('maps early-signups to early_access source', () => {
    expect(buildChrisAnalyticsContext('early-signups', '/booking')).toEqual({
      campaign: 'chris',
      ref: 'early-signups',
      source: 'early_access',
      page: '/booking',
    });
  });

  it('maps social and missing ref to full source', () => {
    expect(buildChrisAnalyticsContext('chris-social', '/booking').source).toBe('full');
    expect(buildChrisAnalyticsContext(null, '/booking').source).toBe('full');
    expect(buildChrisAnalyticsContext(null, '/booking').ref).toBe('direct');
  });
});

describe('resolveChrisWizardExitOutcome', () => {
  it('returns paid when checkout completed', () => {
    expect(
      resolveChrisWizardExitOutcome({
        authSuccess: true,
        sessionContinued: true,
        checkoutStarted: true,
        paid: true,
      }),
    ).toBe('paid');
  });

  it('returns auth_only when only auth succeeded', () => {
    expect(
      resolveChrisWizardExitOutcome({
        authSuccess: true,
        sessionContinued: false,
        checkoutStarted: false,
        paid: false,
      }),
    ).toBe('auth_only');
  });

  it('returns bounce when no progress', () => {
    expect(
      resolveChrisWizardExitOutcome({
        authSuccess: false,
        sessionContinued: false,
        checkoutStarted: false,
        paid: false,
      }),
    ).toBe('bounce');
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

describe('Chris booking funnel events', () => {
  beforeEach(() => {
    track.mockClear();
  });

  const bookingContext = {
    campaign: 'chris',
    ref: 'early-signups',
    source: 'early_access',
    page: '/booking',
  };

  it('emits chris_booking_page_view with signed_in', () => {
    trackChrisBookingPageView('early-signups', false);
    expect(track).toHaveBeenCalledWith('chris_booking_page_view', {
      ...bookingContext,
      signed_in: false,
    });
  });

  it('emits chris_auth_success with auth_mode', () => {
    trackChrisAuthSuccess('early-signups', 'register');
    expect(track).toHaveBeenCalledWith('chris_auth_success', {
      ...bookingContext,
      auth_mode: 'register',
    });
  });

  it('emits chris_session_continue', () => {
    trackChrisSessionContinue('early-signups');
    expect(track).toHaveBeenCalledWith('chris_session_continue', bookingContext);
  });

  it('emits chris_checkout_start without raw booking id', () => {
    trackChrisCheckoutStart('early-signups', 18000);
    expect(track).toHaveBeenCalledWith('chris_checkout_start', {
      ...bookingContext,
      amount_cents: 18000,
      booking_id_present: true,
      skip_payment: false,
    });
  });

  it('emits chris_checkout_success with amount only', () => {
    trackChrisCheckoutSuccess('early-signups', 18000);
    expect(track).toHaveBeenCalledWith('chris_checkout_success', {
      ...bookingContext,
      amount_cents: 18000,
      booking_id_present: true,
    });
  });

  it('emits chris_payment_error with reason', () => {
    trackChrisPaymentError('early-signups', 'validation');
    expect(track).toHaveBeenCalledWith('chris_payment_error', {
      ...bookingContext,
      reason: 'validation',
    });
  });

  it('emits chris_wizard_exit with outcome', () => {
    trackChrisWizardExit('early-signups', 'session', '10-30s', 'auth_only');
    expect(track).toHaveBeenCalledWith('chris_wizard_exit', {
      ...bookingContext,
      last_step: 'session',
      dwell_bucket: '10-30s',
      outcome: 'auth_only',
    });
  });
});