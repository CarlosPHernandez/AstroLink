import {
  CHRIS_SOCIAL_REFERRER,
  CHRIS_WAITLIST_EMAIL_REFERRER,
} from '@/lib/chris-campaign/chris-campaign-constants';
import { parseEarlyAccessReferrer } from '@/lib/waitlist/early-access-referrer';

/** Public Chris promotion links: /talk-with-chris?ref=chris-sembroski */
export const CHRIS_PUBLIC_REFERRER = 'chris-sembroski';

export { CHRIS_SOCIAL_REFERRER, CHRIS_WAITLIST_EMAIL_REFERRER };

/**
 * Parse `?ref=` from Chris landing or booking URLs.
 * Reuses early-access kebab-case validation — see marketing-referrer-taxonomy.md.
 */
export function parseChrisCampaignReferrer(search: string): string | undefined {
  return parseEarlyAccessReferrer(search);
}
