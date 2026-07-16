import { WAITLIST_PUBLIC_LANDING_PATH } from '@/lib/waitlist/waitlist-landing';

/** Campaign landing link with a stable marketing referrer id. */
export function getChrisWaitlistHref(referrer: string): string {
  return `${WAITLIST_PUBLIC_LANDING_PATH}?ref=${encodeURIComponent(referrer)}`;
}
