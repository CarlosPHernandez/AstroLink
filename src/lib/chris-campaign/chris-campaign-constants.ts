export const CHRIS_CAMPAIGN_ID = 'chris-sembroski';
export const CHRIS_MENTOR_SLUG_DEFAULT = 'chris-sembroski';
export const CHRIS_BOOKING_CAMPAIGN_QUERY = 'chris';
/** Default live session length for Chris campaign bookings (UI + price menu key). */
export const CHRIS_SESSION_DURATION_MINUTES = 45;

/**
 * Public full-hour anchor ($250/hr).
 * Session charges use the whole-dollar menus below — never linear pro-rata (avoids $66.67).
 */
export const CHRIS_HOURLY_PRICE_CENTS = 25000;

/**
 * Full public / social list price by duration (whole dollars).
 * Floors are ≥ $250/hr pro-rata; short slots carry a small clean premium.
 * 15→$65 · 30→$125 · 45→$190 · 60→$250
 */
export const CHRIS_FULL_PRICE_BY_DURATION_CENTS = {
  15: 6500,
  30: 12500,
  45: 19000,
  60: 25000,
} as const;

/**
 * Early-access waitlist menu (whole dollars, ~10% under list).
 * 15→$60 · 30→$115 · 45→$170 · 60→$225
 */
export const CHRIS_EARLY_PRICE_BY_DURATION_CENTS = {
  15: 6000,
  30: 11500,
  45: 17000,
  60: 22500,
} as const;

export type ChrisPricedDurationMinutes = keyof typeof CHRIS_FULL_PRICE_BY_DURATION_CENTS;

/** Full public price at the default 45-min length ($190). */
export const CHRIS_ORIGINAL_PRICE_CENTS =
  CHRIS_FULL_PRICE_BY_DURATION_CENTS[CHRIS_SESSION_DURATION_MINUTES];

/** Marketing discount name for early-access waitlist tier only. */
export const CHRIS_DISCOUNT_NAME = 'Inspired24';
/** Approximate marketing discount; actual early menu is the SOOT table above. */
export const CHRIS_DISCOUNT_PERCENT = 10;

/** Early-access waitlist charge at default 45-min length ($170). */
export const CHRIS_LAUNCH_PRICE_CENTS =
  CHRIS_EARLY_PRICE_BY_DURATION_CENTS[CHRIS_SESSION_DURATION_MINUTES];

/** Full public / social charge at default 45-min length. */
export const CHRIS_FULL_PRICE_CENTS = CHRIS_ORIGINAL_PRICE_CENTS;

/** Waitlist email attribution — early-access menu + slot scarcity UI. */
export const CHRIS_WAITLIST_EMAIL_REFERRER = 'early-signups';

/** Chris social / public promotion — full menu, no limited-slot scarcity UI. */
export const CHRIS_SOCIAL_REFERRER = 'chris-social';

/** Minimum goals length for Chris campaign session continue / book (conversion floor). */
export const CHRIS_GOALS_MIN_CHARS = 50;
