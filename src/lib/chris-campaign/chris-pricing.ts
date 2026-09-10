import {
  CHRIS_FULL_PRICE_BY_DURATION_CENTS,
  CHRIS_HOURLY_PRICE_CENTS,
  CHRIS_SESSION_DURATION_MINUTES,
  type ChrisPricedDurationMinutes,
} from '@/lib/chris-campaign/chris-campaign-constants';
import { clampSessionDurationMinutes } from '@/lib/session-duration';

/**
 * Chris charge tiers (server is source of truth — never trust client amount).
 *
 * Waitlist early-access pricing is retired. Every `ref` (including leftover
 * `early-signups` links) charges the public $250/hr whole-dollar menu.
 * `early_access` remains on the type for historical PaymentIntent metadata.
 *
 * Anchor: $250/hr. Prices are a whole-dollar menu by duration (not linear pro-rata).
 */
export type ChrisPricingTier = 'early_access' | 'full';

export function resolveChrisPricingTier(
  _marketingReferrer?: string | null,
): ChrisPricingTier {
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

/** Stripe PaymentIntent amount for campaign=chris (public menu by duration). */
export function resolveChrisChargeCents(
  _marketingReferrer: string | null | undefined,
  durationMinutes: number = CHRIS_SESSION_DURATION_MINUTES,
): number {
  return CHRIS_FULL_PRICE_BY_DURATION_CENTS[toPricedDuration(durationMinutes)];
}

/** Waitlist scarcity UI is retired — public booking does not show spots remaining. */
export function showChrisSlotScarcity(
  _marketingReferrer?: string | null,
): boolean {
  return false;
}

export function chrisPricingMode(
  _marketingReferrer?: string | null,
): 'chris_early_access_menu' | 'chris_full_250' {
  return 'chris_full_250';
}

/** Waitlist early-access discount is retired. */
export function chrisEarlyAccessDiscountCents(
  _marketingReferrer?: string | null,
  _durationMinutes: number = CHRIS_SESSION_DURATION_MINUTES,
): number {
  return 0;
}

/** Hourly anchor for docs/UI copy ($250). */
export function chrisHourlyAnchorCents(): number {
  return CHRIS_HOURLY_PRICE_CENTS;
}
