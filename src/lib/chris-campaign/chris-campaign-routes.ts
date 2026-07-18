import 'server-only';

import { isChrisCampaignBookingQuery } from '@/lib/chris-campaign/chris-booking-mode';
import { isChrisBookingEnabled } from '@/lib/chris-campaign/chris-campaign-config';

/** Public campaign landing (PR2 adds full Stitch UI). */
export const CHRIS_CAMPAIGN_LANDING_PATH = '/talk-with-chris';

/**
 * Signed-out users may open the Chris wizard at /booking?campaign=chris (inline auth).
 * Generic /booking still requires a session when the full app surface is protected.
 */
export function isChrisCampaignBookingEntry(
  pathname: string,
  campaign: string | null | undefined,
  options?: { chrisBookingEnabled?: boolean },
): boolean {
  const chrisBookingEnabled = options?.chrisBookingEnabled ?? isChrisBookingEnabled();
  if (!chrisBookingEnabled) {
    return false;
  }
  if (pathname !== '/booking' && !pathname.startsWith('/booking/')) {
    return false;
  }
  return isChrisCampaignBookingQuery(campaign);
}

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
  // Ops concierge: signed-token 45-min slot picker after preferred day changes
  if (pathname === '/r/chris-slot' || pathname.startsWith('/r/chris-slot/')) {
    return true;
  }
  return false;
}

export function isChrisBookingApiRoute(pathname: string): boolean {
  if (pathname === '/api/auth/session') {
    return true;
  }
  if (pathname === '/api/book' || pathname.startsWith('/api/book/')) {
    return true;
  }
  if (pathname.startsWith('/api/bookings/')) {
    return true;
  }
  if (pathname === '/api/session/provision' || pathname.startsWith('/api/session/')) {
    return true;
  }
  if (pathname === '/api/chris-slot-choice') {
    return true;
  }
  return false;
}

export function isChrisJoinRedirectPath(pathname: string): boolean {
  return pathname === '/join/chris-sembroski';
}