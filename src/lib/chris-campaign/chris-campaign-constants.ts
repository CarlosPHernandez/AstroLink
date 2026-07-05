export const CHRIS_CAMPAIGN_ID = 'chris-sembroski';
export const CHRIS_MENTOR_SLUG_DEFAULT = 'chris-sembroski';
export const CHRIS_BOOKING_CAMPAIGN_QUERY = 'chris';
/** Fixed live session length for Chris campaign bookings (UI + server). */
export const CHRIS_SESSION_DURATION_MINUTES = 45;

/** Original price for Chris 45-min session in this specific case ($200 before discount). 
 *  For the $1 test coupon (amount_off 19900 / id OMFhV6g2), the actual charge will be $1.
 *  Use CHRIS_STRIPE_COUPON_ID or _PROMOTION_CODE in env (auto-detects format).
 */
export const CHRIS_ORIGINAL_PRICE_CENTS = 20000; // $200 flat for the 45 min session (not hourly)

/** Marketing discount for Chris campaign (10% off). 
 *  The actual Stripe discount uses the coupon/promo code configured via 
 *  CHRIS_STRIPE_PROMOTION_CODE or CHRIS_STRIPE_COUPON_ID env vars.
 *  Set the promotion code name to "Inspired24" in Stripe dashboard + env.
 */
export const CHRIS_DISCOUNT_NAME = 'Inspired24';
export const CHRIS_DISCOUNT_PERCENT = 10;