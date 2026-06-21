import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  isStripeConnectPayoutsEnabled,
  resolvePayoutNavStatus,
} from '@/lib/mentor-payouts-config';

describe('mentor-payouts-config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('isStripeConnectPayoutsEnabled is false by default', () => {
    vi.stubEnv('ENABLE_STRIPE_CONNECT_PAYOUTS', '');
    expect(isStripeConnectPayoutsEnabled()).toBe(false);
  });

  it('isStripeConnectPayoutsEnabled is true when env is set', () => {
    vi.stubEnv('ENABLE_STRIPE_CONNECT_PAYOUTS', 'true');
    expect(isStripeConnectPayoutsEnabled()).toBe(true);
  });

  it('resolvePayoutNavStatus maps launch and dev modes', () => {
    expect(
      resolvePayoutNavStatus({
        skipStripePayments: true,
        connectPayoutsEnabled: false,
        stripeOnboardingCompleted: false,
      }),
    ).toBe('dev_skip');

    expect(
      resolvePayoutNavStatus({
        skipStripePayments: false,
        connectPayoutsEnabled: false,
        stripeOnboardingCompleted: false,
      }),
    ).toBe('manual');

    expect(
      resolvePayoutNavStatus({
        skipStripePayments: false,
        connectPayoutsEnabled: true,
        stripeOnboardingCompleted: true,
      }),
    ).toBe('connected');

    expect(
      resolvePayoutNavStatus({
        skipStripePayments: false,
        connectPayoutsEnabled: true,
        stripeOnboardingCompleted: false,
      }),
    ).toBe('setup_required');
  });
});