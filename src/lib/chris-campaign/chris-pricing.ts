import {
  CHRIS_FULL_PRICE_CENTS,
  CHRIS_LAUNCH_PRICE_CENTS,
  CHRIS_ORIGINAL_PRICE_CENTS,
  CHRIS_WAITLIST_EMAIL_REFERRER,
} from '@/lib/chris-campaign/chris-campaign-constants';

/**
 * Chris charge tiers (server is source of truth — never trust client amount).
 *
 * - early_access: waitlist email `ref=early-signups` → $180 + show slot scarcity
 * - full: social / public / missing ref → $200 + hide limited-slot scarcity UI
 */
export type ChrisPricingTier = 'early_access' | 'full';

export function resolveChrisPricingTier(
  marketingReferrer: string | null | undefined,
): ChrisPricingTier {
  const ref = marketingReferrer?.trim() ?? '';
  if (ref === CHRIS_WAITLIST_EMAIL_REFERRER) {
    return 'early_access';
  }
  return 'full';
}

/** Stripe PaymentIntent amount for campaign=chris. */
export function resolveChrisChargeCents(
  marketingReferrer: string | null | undefined,
): number {
  return resolveChrisPricingTier(marketingReferrer) === 'early_access'
    ? CHRIS_LAUNCH_PRICE_CENTS
    : CHRIS_FULL_PRICE_CENTS;
}

/** Show “spots remaining” scarcity only for early-access waitlist traffic. */
export function showChrisSlotScarcity(
  marketingReferrer: string | null | undefined,
): boolean {
  return resolveChrisPricingTier(marketingReferrer) === 'early_access';
}

export function chrisPricingMode(
  marketingReferrer: string | null | undefined,
): 'chris_early_access_180' | 'chris_full_200' {
  return resolveChrisPricingTier(marketingReferrer) === 'early_access'
    ? 'chris_early_access_180'
    : 'chris_full_200';
}

/** Discount line only applies on early-access tier. */
export function chrisEarlyAccessDiscountCents(
  marketingReferrer: string | null | undefined,
): number {
  if (resolveChrisPricingTier(marketingReferrer) !== 'early_access') {
    return 0;
  }
  return CHRIS_ORIGINAL_PRICE_CENTS - CHRIS_LAUNCH_PRICE_CENTS;
}
