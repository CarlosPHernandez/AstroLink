/** Waitlist signup link with a stable marketing referrer id. */
export function getChrisWaitlistHref(referrer: string): string {
  return `/early-access?ref=${encodeURIComponent(referrer)}`;
}
