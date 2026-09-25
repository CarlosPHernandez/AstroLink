export const OFFER_DURATIONS = [15, 30, 45, 60] as const;
export type OfferDurationMinutes = (typeof OFFER_DURATIONS)[number];

export const OFFER_PRICE_MIN_CENTS = 1000;
export const OFFER_PRICE_MAX_CENTS = 50000;
export const OFFER_TITLE_MIN = 8;
export const OFFER_TITLE_MAX = 80;
export const OFFER_DESCRIPTION_MIN = 40;
export const OFFER_DESCRIPTION_MAX = 1200;
export const OFFER_PUBLISHED_CAP = 5;
export const OFFER_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isOfferDuration(value: number): value is OfferDurationMinutes {
  return (OFFER_DURATIONS as readonly number[]).includes(value);
}
