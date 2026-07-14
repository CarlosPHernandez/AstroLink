import { describe, expect, it } from 'vitest';
import {
  CHRIS_FULL_PRICE_CENTS,
  CHRIS_LAUNCH_PRICE_CENTS,
  CHRIS_ORIGINAL_PRICE_CENTS,
  CHRIS_SOCIAL_REFERRER,
  CHRIS_WAITLIST_EMAIL_REFERRER,
} from '@/lib/chris-campaign/chris-campaign-constants';
import {
  chrisEarlyAccessDiscountCents,
  chrisPricingMode,
  resolveChrisChargeCents,
  resolveChrisPricingTier,
  showChrisSlotScarcity,
} from '@/lib/chris-campaign/chris-pricing';

describe('chris-pricing', () => {
  it('charges $180 early access only for early-signups', () => {
    expect(resolveChrisPricingTier(CHRIS_WAITLIST_EMAIL_REFERRER)).toBe('early_access');
    expect(resolveChrisChargeCents(CHRIS_WAITLIST_EMAIL_REFERRER)).toBe(18000);
    expect(resolveChrisChargeCents(CHRIS_WAITLIST_EMAIL_REFERRER)).toBe(
      CHRIS_LAUNCH_PRICE_CENTS,
    );
    expect(showChrisSlotScarcity(CHRIS_WAITLIST_EMAIL_REFERRER)).toBe(true);
    expect(chrisPricingMode(CHRIS_WAITLIST_EMAIL_REFERRER)).toBe('chris_early_access_180');
    expect(chrisEarlyAccessDiscountCents(CHRIS_WAITLIST_EMAIL_REFERRER)).toBe(2000);
  });

  it('charges full $200 for social, public, and missing ref', () => {
    for (const ref of [CHRIS_SOCIAL_REFERRER, 'chris-sembroski', undefined, null, '', '  ']) {
      expect(resolveChrisPricingTier(ref)).toBe('full');
      expect(resolveChrisChargeCents(ref)).toBe(CHRIS_FULL_PRICE_CENTS);
      expect(resolveChrisChargeCents(ref)).toBe(CHRIS_ORIGINAL_PRICE_CENTS);
      expect(showChrisSlotScarcity(ref)).toBe(false);
      expect(chrisPricingMode(ref)).toBe('chris_full_200');
      expect(chrisEarlyAccessDiscountCents(ref)).toBe(0);
    }
  });
});
