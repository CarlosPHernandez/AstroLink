import { describe, expect, it } from 'vitest';
import { dollarsToPriceCents } from '@/lib/expert-offers/money';
import { OFFER_PRICE_MAX_CENTS, OFFER_PRICE_MIN_CENTS } from '@/lib/expert-offers/constants';

describe('dollarsToPriceCents', () => {
  it('converts whole dollars and two-decimal dollars', () => {
    expect(dollarsToPriceCents(10)).toBe(1000);
    expect(dollarsToPriceCents('10')).toBe(1000);
    expect(dollarsToPriceCents('12.50')).toBe(1250);
  });

  it('rejects below $10 and above $500', () => {
    expect(dollarsToPriceCents(9.99)).toBeNull();
    expect(dollarsToPriceCents(500.01)).toBeNull();
    expect(dollarsToPriceCents(OFFER_PRICE_MIN_CENTS / 100)).toBe(OFFER_PRICE_MIN_CENTS);
    expect(dollarsToPriceCents(OFFER_PRICE_MAX_CENTS / 100)).toBe(OFFER_PRICE_MAX_CENTS);
  });

  it('rejects non-numeric input', () => {
    expect(dollarsToPriceCents('nope')).toBeNull();
  });
});
