import { describe, expect, it } from 'vitest';
import {
  CHRIS_EARLY_PRICE_BY_DURATION_CENTS,
  CHRIS_FULL_PRICE_BY_DURATION_CENTS,
  CHRIS_HOURLY_PRICE_CENTS,
  CHRIS_LAUNCH_PRICE_CENTS,
  CHRIS_ORIGINAL_PRICE_CENTS,
  CHRIS_SOCIAL_REFERRER,
  CHRIS_WAITLIST_EMAIL_REFERRER,
} from '@/lib/chris-campaign/chris-campaign-constants';
import {
  chrisEarlyAccessDiscountCents,
  chrisPricingMode,
  resolveChrisChargeCents,
  resolveChrisOriginalPriceCents,
  resolveChrisPricingTier,
  showChrisSlotScarcity,
} from '@/lib/chris-campaign/chris-pricing';

describe('chris-pricing ($250/hr whole-dollar menu)', () => {
  it('anchors full hour at $250 and default 45-min list at $190', () => {
    expect(CHRIS_HOURLY_PRICE_CENTS).toBe(25000);
    expect(CHRIS_ORIGINAL_PRICE_CENTS).toBe(19000);
    expect(CHRIS_LAUNCH_PRICE_CENTS).toBe(17000);
    expect(resolveChrisOriginalPriceCents(60)).toBe(25000);
    expect(resolveChrisOriginalPriceCents(45)).toBe(19000);
  });

  it('uses whole-dollar full menu for all stepped durations', () => {
    expect(resolveChrisChargeCents(CHRIS_SOCIAL_REFERRER, 15)).toBe(6500);
    expect(resolveChrisChargeCents(CHRIS_SOCIAL_REFERRER, 30)).toBe(12500);
    expect(resolveChrisChargeCents(CHRIS_SOCIAL_REFERRER, 45)).toBe(19000);
    expect(resolveChrisChargeCents(CHRIS_SOCIAL_REFERRER, 60)).toBe(25000);
    // No cents leftovers
    for (const cents of Object.values(CHRIS_FULL_PRICE_BY_DURATION_CENTS)) {
      expect(cents % 100).toBe(0);
    }
  });

  it('never undercuts $250/hr pro-rata on the full menu', () => {
    for (const [minutes, cents] of Object.entries(CHRIS_FULL_PRICE_BY_DURATION_CENTS)) {
      const floor = Math.ceil((CHRIS_HOURLY_PRICE_CENTS * Number(minutes)) / 60);
      expect(cents).toBeGreaterThanOrEqual(floor);
    }
  });

  it('charges early-access menu only for early-signups', () => {
    expect(resolveChrisPricingTier(CHRIS_WAITLIST_EMAIL_REFERRER)).toBe('early_access');
    expect(resolveChrisChargeCents(CHRIS_WAITLIST_EMAIL_REFERRER)).toBe(17000);
    expect(resolveChrisChargeCents(CHRIS_WAITLIST_EMAIL_REFERRER, 15)).toBe(6000);
    expect(resolveChrisChargeCents(CHRIS_WAITLIST_EMAIL_REFERRER, 30)).toBe(11500);
    expect(resolveChrisChargeCents(CHRIS_WAITLIST_EMAIL_REFERRER, 60)).toBe(22500);
    expect(showChrisSlotScarcity(CHRIS_WAITLIST_EMAIL_REFERRER)).toBe(true);
    expect(chrisPricingMode(CHRIS_WAITLIST_EMAIL_REFERRER)).toBe('chris_early_access_menu');
    expect(chrisEarlyAccessDiscountCents(CHRIS_WAITLIST_EMAIL_REFERRER, 45)).toBe(2000);
    for (const cents of Object.values(CHRIS_EARLY_PRICE_BY_DURATION_CENTS)) {
      expect(cents % 100).toBe(0);
    }
  });

  it('charges full menu for social, public, and missing ref', () => {
    for (const ref of [CHRIS_SOCIAL_REFERRER, 'chris-sembroski', undefined, null, '', '  ']) {
      expect(resolveChrisPricingTier(ref)).toBe('full');
      expect(resolveChrisChargeCents(ref)).toBe(19000);
      expect(showChrisSlotScarcity(ref)).toBe(false);
      expect(chrisPricingMode(ref)).toBe('chris_full_250');
      expect(chrisEarlyAccessDiscountCents(ref)).toBe(0);
    }
  });
});
