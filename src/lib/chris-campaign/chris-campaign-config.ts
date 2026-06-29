import 'server-only';

export const CHRIS_CAMPAIGN_ID = 'chris-sembroski';
export const CHRIS_MENTOR_SLUG_DEFAULT = 'chris-sembroski';
export const CHRIS_BOOKING_CAMPAIGN_QUERY = 'chris';

/** Opens booking funnel under waitlist APP_MODE (Vercel Production only). */
export function isChrisBookingEnabled(): boolean {
  return process.env.CHRIS_BOOKING_ENABLED?.trim().toLowerCase() === 'true';
}

export function getChrisCampaignId(): string {
  const fromEnv = process.env.CHRIS_CAMPAIGN_ID?.trim();
  return fromEnv || CHRIS_CAMPAIGN_ID;
}

export function getChrisMentorSlug(): string {
  const fromEnv = process.env.CHRIS_MENTOR_SLUG?.trim();
  return fromEnv || CHRIS_MENTOR_SLUG_DEFAULT;
}

export function getChrisSlotCapFromEnv(): number {
  const raw = process.env.CHRIS_SLOT_CAP?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 10;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}

export function isChrisCampaignBookingQuery(campaign: string | null | undefined): boolean {
  return campaign === CHRIS_BOOKING_CAMPAIGN_QUERY;
}