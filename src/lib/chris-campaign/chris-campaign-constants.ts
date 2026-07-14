export const CHRIS_CAMPAIGN_ID = 'chris-sembroski';
export const CHRIS_MENTOR_SLUG_DEFAULT = 'chris-sembroski';
export const CHRIS_BOOKING_CAMPAIGN_QUERY = 'chris';
/** Fixed live session length for Chris campaign bookings (UI + server). */
export const CHRIS_SESSION_DURATION_MINUTES = 45;

/** Full public price for Chris 45-min session ($200 flat, not hourly). */
export const CHRIS_ORIGINAL_PRICE_CENTS = 20000;

/** Marketing discount name for early-access waitlist tier only. */
export const CHRIS_DISCOUNT_NAME = 'Inspired24';
export const CHRIS_DISCOUNT_PERCENT = 10;

/**
 * Early-access waitlist charge ($180 = 10% off $200).
 * Applied only when marketing_referrer is early-signups (see chris-pricing.ts).
 */
export const CHRIS_LAUNCH_PRICE_CENTS = 18000;

/** Full public / social charge — same as original list price. */
export const CHRIS_FULL_PRICE_CENTS = CHRIS_ORIGINAL_PRICE_CENTS;

/** Waitlist email attribution — gets early-access $180 + slot scarcity UI. */
export const CHRIS_WAITLIST_EMAIL_REFERRER = 'early-signups';

/** Chris social / public promotion — full $200, no limited-slot scarcity UI. */
export const CHRIS_SOCIAL_REFERRER = 'chris-social';
