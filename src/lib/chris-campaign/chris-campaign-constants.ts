export const CHRIS_CAMPAIGN_ID = 'chris-sembroski';
export const CHRIS_MENTOR_SLUG_DEFAULT = 'chris-sembroski';
export const CHRIS_BOOKING_CAMPAIGN_QUERY = 'chris';
/** Fixed live session length for Chris campaign bookings (UI + server). */
export const CHRIS_SESSION_DURATION_MINUTES = 45;

/** Original price for Chris 45-min session in this specific case ($200 before discount).
 * TEMP: set to $1 (100 cents) for live real-card testing + log capture.
 * Restore to 20000 + proper launch price after testing.
 */
export const CHRIS_ORIGINAL_PRICE_CENTS = 20000; // $200 flat for the 45 min session (not hourly)

/** Marketing discount for Chris campaign (10% off). */
export const CHRIS_DISCOUNT_NAME = 'Inspired24';
export const CHRIS_DISCOUNT_PERCENT = 10;

/** Launch amount collected immediately for the discounted Chris session.
 * TEMP for $1 test: overriding to 100 cents.
 */
export const CHRIS_LAUNCH_PRICE_CENTS = 100;
