import { parseEarlyAccessReferrer } from '@/lib/waitlist/early-access-referrer';

/** Public Chris promotion links: /talk-with-chris?ref=chris-sembroski */
export const CHRIS_PUBLIC_REFERRER = 'chris-sembroski';

/** Waitlist email split for Chris campaign: /early-access?ref=early-signups */
export const CHRIS_WAITLIST_EMAIL_REFERRER = 'early-signups';

/**
 * Parse `?ref=` from Chris landing or booking URLs.
 * Reuses early-access kebab-case validation — see marketing-referrer-taxonomy.md.
 */
export function parseChrisCampaignReferrer(search: string): string | undefined {
  return parseEarlyAccessReferrer(search);
}
