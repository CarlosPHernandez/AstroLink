import {
  CHRIS_EARLY_PRICE_BY_DURATION_CENTS,
  CHRIS_FULL_PRICE_BY_DURATION_CENTS,
  CHRIS_HOURLY_PRICE_CENTS,
  CHRIS_SESSION_DURATION_MINUTES,
  CHRIS_WAITLIST_EMAIL_REFERRER,
  type ChrisPricedDurationMinutes,
} from '@/lib/chris-campaign/chris-campaign-constants';
import { clampSessionDurationMinutes } from '@/lib/session-duration';

/**
 * Chris charge tiers (server is source of truth — never trust client amount).
 *
 * - early_access: waitlist email `ref=early-signups` → early menu + slot scarcity
 * - full: social / public / missing ref → full menu + hide limited-slot scarcity UI
 *
 * Anchor: $250/hr. Prices are a whole-dollar menu by duration (not linear pro-rata).
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

function toPricedDuration(durationMinutes: number): ChrisPricedDurationMinutes {
  const minutes = clampSessionDurationMinutes(durationMinutes);
  if (minutes in CHRIS_FULL_PRICE_BY_DURATION_CENTS) {
    return minutes as ChrisPricedDurationMinutes;
  }
  return CHRIS_SESSION_DURATION_MINUTES;
}

/** Full public list price for the selected length (whole-dollar menu). */
export function resolveChrisOriginalPriceCents(
  durationMinutes: number = CHRIS_SESSION_DURATION_MINUTES,
): number {
  return CHRIS_FULL_PRICE_BY_DURATION_CENTS[toPricedDuration(durationMinutes)];
}

/**
 * @deprecated Prefer resolveChrisOriginalPriceCents — name kept for call-site continuity.
 * Whole-dollar menu lookup (ignores baseCents; duration is the key).
 */
export function scaleChrisPriceForDuration(
  _baseCents: number,
  durationMinutes: number = CHRIS_SESSION_DURATION_MINUTES,
): number {
  return resolveChrisOriginalPriceCents(durationMinutes);
}

/** Stripe PaymentIntent amount for campaign=chris (menu by duration + tier). */
export function resolveChrisChargeCents(
  marketingReferrer: string | null | undefined,
  durationMinutes: number = CHRIS_SESSION_DURATION_MINUTES,
): number {
  const key = toPricedDuration(durationMinutes);
  if (resolveChrisPricingTier(marketingReferrer) === 'early_access') {
    return CHRIS_EARLY_PRICE_BY_DURATION_CENTS[key];
  }
  return CHRIS_FULL_PRICE_BY_DURATION_CENTS[key];
}

/** Show “spots remaining” scarcity only for early-access waitlist traffic. */
export function showChrisSlotScarcity(
  marketingReferrer: string | null | undefined,
): boolean {
  return resolveChrisPricingTier(marketingReferrer) === 'early_access';
}

export function chrisPricingMode(
  marketingReferrer: string | null | undefined,
): 'chris_early_access_menu' | 'chris_full_250' {
  return resolveChrisPricingTier(marketingReferrer) === 'early_access'
    ? 'chris_early_access_menu'
    : 'chris_full_250';
}

/** Discount line only applies on early-access tier (list − charge at that duration). */
export function chrisEarlyAccessDiscountCents(
  marketingReferrer: string | null | undefined,
  durationMinutes: number = CHRIS_SESSION_DURATION_MINUTES,
): number {
  if (resolveChrisPricingTier(marketingReferrer) !== 'early_access') {
    return 0;
  }
  return (
    resolveChrisOriginalPriceCents(durationMinutes) -
    resolveChrisChargeCents(marketingReferrer, durationMinutes)
  );
}

/** Hourly anchor for docs/UI copy ($250). */
export function chrisHourlyAnchorCents(): number {
  return CHRIS_HOURLY_PRICE_CENTS;
}
