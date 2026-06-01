import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createDevSkippedPaymentIntentId,
  isDevSkippedPaymentIntent,
  isStripePaymentsSkipped,
} from '@/lib/booking-payments';

describe('booking-payments dev helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('isStripePaymentsSkipped', () => {
    it('returns false in production even when env flag is set', () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('SKIP_STRIPE_PAYMENTS', 'true');
      expect(isStripePaymentsSkipped()).toBe(false);
    });

    it('returns true in non-production when SKIP_STRIPE_PAYMENTS=true', () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('SKIP_STRIPE_PAYMENTS', 'true');
      expect(isStripePaymentsSkipped()).toBe(true);
    });

    it('returns false when flag is unset', () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('SKIP_STRIPE_PAYMENTS', '');
      expect(isStripePaymentsSkipped()).toBe(false);
    });
  });

  describe('dev skip payment intent ids', () => {
    it('creates ids with dev_skip prefix', () => {
      const id = createDevSkippedPaymentIntentId();
      expect(id.startsWith('dev_skip_')).toBe(true);
      expect(isDevSkippedPaymentIntent(id)).toBe(true);
    });

    it('does not treat real Stripe ids as dev skip', () => {
      expect(isDevSkippedPaymentIntent('pi_3abc123')).toBe(false);
    });
  });
});
