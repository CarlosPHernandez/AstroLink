import { OFFER_PRICE_MAX_CENTS, OFFER_PRICE_MIN_CENTS } from '@/lib/expert-offers/constants';

export function dollarsToPriceCents(input: string | number): number | null {
  const n = typeof input === 'number' ? input : Number.parseFloat(input.trim());
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  if (cents < OFFER_PRICE_MIN_CENTS || cents > OFFER_PRICE_MAX_CENTS) return null;
  return cents;
}
