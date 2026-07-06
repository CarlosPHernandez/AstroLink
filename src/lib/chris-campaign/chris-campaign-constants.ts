export const CHRIS_CAMPAIGN_ID = 'chris-sembroski';
export const CHRIS_MENTOR_SLUG_DEFAULT = 'chris-sembroski';
export const CHRIS_BOOKING_CAMPAIGN_QUERY = 'chris';
/** Fixed live session length for Chris campaign bookings (UI + server). */
export const CHRIS_SESSION_DURATION_MINUTES = 45;

/** Original price for Chris 45-min session in this specific case ($200 before discount). 
 */
export const CHRIS_ORIGINAL_PRICE_CENTS = 20000; // $200 flat for the 45 min session (not hourly)

/** Temporary real-money checkout amount for validating the Chris booking flow end-to-end. */
export const CHRIS_TEST_PAYMENT_AMOUNT_CENTS = 100;

/** Marketing discount for Chris campaign (10% off). 
 *  When the $1 live-flow test ends, apply this by charging the final server-calculated
 *  PaymentIntent amount directly unless the flow moves to Stripe Checkout Sessions.
 */
export const CHRIS_DISCOUNT_NAME = 'Inspired24';
export const CHRIS_DISCOUNT_PERCENT = 10;
