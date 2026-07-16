/** Primary public surface after the /early-access waitlist page was retired. */
export const WAITLIST_PUBLIC_LANDING_PATH = '/talk-with-chris';

export function isRetiredEarlyAccessPath(pathname: string): boolean {
  return pathname === '/early-access' || pathname === '/early-access/player';
}

/** Preserve marketing query params when redirecting off retired waitlist URLs. */
export function buildWaitlistLandingRedirect(pathname: string, search: string): string {
  const base = WAITLIST_PUBLIC_LANDING_PATH;
  if (!search) {
    return base;
  }
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (pathname === '/early-access' || pathname === '/early-access/player') {
    if (!params.has('ref')) {
      params.set('ref', 'early-signups');
    }
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}