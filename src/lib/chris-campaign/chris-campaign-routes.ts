import 'server-only';

/** Public campaign landing (PR2 adds full Stitch UI). */
export const CHRIS_CAMPAIGN_LANDING_PATH = '/talk-with-chris';

export function isChrisBookingPageRoute(pathname: string): boolean {
  if (pathname === CHRIS_CAMPAIGN_LANDING_PATH) {
    return true;
  }
  if (pathname === '/auth' || pathname.startsWith('/auth/')) {
    return true;
  }
  if (pathname === '/booking' || pathname.startsWith('/booking/')) {
    return true;
  }
  if (pathname === '/session' || pathname.startsWith('/session/')) {
    return true;
  }
  if (pathname === '/dashboard/mentee' || pathname.startsWith('/dashboard/mentee/')) {
    return true;
  }
  return false;
}

export function isChrisBookingApiRoute(pathname: string): boolean {
  if (pathname === '/api/auth/session') {
    return true;
  }
  if (pathname === '/api/book' || pathname === '/api/book/briefing') {
    return true;
  }
  if (pathname.startsWith('/api/bookings/') && pathname.endsWith('/cancel')) {
    return true;
  }
  if (pathname === '/api/session/provision' || pathname.startsWith('/api/session/')) {
    return true;
  }
  return false;
}

export function isChrisJoinRedirectPath(pathname: string): boolean {
  return pathname === '/join/chris-sembroski';
}