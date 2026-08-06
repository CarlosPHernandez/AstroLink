import 'server-only';

import { isChrisBookingEnabled } from '@/lib/chris-campaign/chris-campaign-config';
import {
  CHRIS_CAMPAIGN_LANDING_PATH,
  isChrisBookingApiRoute,
  isChrisBookingPageRoute,
  isChrisJoinRedirectPath,
} from '@/lib/chris-campaign/chris-campaign-routes';
import {
  isRetiredEarlyAccessPath,
  WAITLIST_PUBLIC_LANDING_PATH,
} from '@/lib/waitlist/waitlist-landing';

export const WAITLIST_PUBLIC_PAGES = ['/press', '/privacy'] as const;

export type WaitlistRedirectDestination = typeof WAITLIST_PUBLIC_LANDING_PATH;

export type WaitlistRouteDecision =
  | { action: 'allow' }
  | { action: 'redirect'; destination: WaitlistRedirectDestination }
  | { action: 'api_blocked' };

export function isWaitlistJoinPage(pathname: string): boolean {
  const prefix = '/join/';
  return pathname.startsWith(prefix) && pathname.length > prefix.length;
}

export function isWaitlistExpertsPage(pathname: string): boolean {
  if (pathname === '/experts') {
    return true;
  }
  const prefix = '/experts/';
  return pathname.startsWith(prefix) && pathname.length > prefix.length;
}

/** Next.js metadata routes — must not redirect to early-access (Google expects XML/text). */
export function isWaitlistSeoCrawlPage(pathname: string): boolean {
  return pathname === '/robots.txt' || pathname === '/sitemap.xml';
}

/** Free Space Path Assessment funnel (no account). */
export function isPathAssessmentPublicPage(pathname: string): boolean {
  if (pathname === '/assessment') return true;
  const prefix = '/assessment/';
  return pathname.startsWith(prefix) && pathname.length > prefix.length;
}

export function isWaitlistPublicPage(pathname: string, chrisBookingEnabled = isChrisBookingEnabled()): boolean {
  if (chrisBookingEnabled && isWaitlistExpertsPage(pathname)) {
    return false;
  }

  return (
    (WAITLIST_PUBLIC_PAGES as readonly string[]).includes(pathname) ||
    isWaitlistExpertsPage(pathname) ||
    isWaitlistSeoCrawlPage(pathname) ||
    isPathAssessmentPublicPage(pathname)
  );
}

export function isWaitlistAdminPage(pathname: string): boolean {
  return pathname === '/dashboard/admin' || pathname.startsWith('/dashboard/admin/');
}

/** API routes that remain reachable in waitlist mode (handlers enforce auth). */
export function isWaitlistAllowedApi(pathname: string): boolean {
  if (pathname === '/api/early-access') return true;
  if (pathname === '/api/path-assessment' || pathname.startsWith('/api/path-assessment/')) {
    return true;
  }
  if (pathname.startsWith('/api/admin/')) return true;
  if (pathname.startsWith('/api/webhooks/')) return true;
  return false;
}

export function resolveWaitlistRoute(
  pathname: string,
  session: { role: string } | null,
  options?: { chrisBookingEnabled?: boolean },
): WaitlistRouteDecision {
  const chrisBookingEnabled = options?.chrisBookingEnabled ?? isChrisBookingEnabled();

  if (pathname.startsWith('/api/')) {
    if (chrisBookingEnabled && isChrisBookingApiRoute(pathname)) {
      return { action: 'allow' };
    }
    return isWaitlistAllowedApi(pathname) ? { action: 'allow' } : { action: 'api_blocked' };
  }

  if (isRetiredEarlyAccessPath(pathname)) {
    return { action: 'redirect', destination: WAITLIST_PUBLIC_LANDING_PATH };
  }

  if (isWaitlistJoinPage(pathname)) {
    return { action: 'redirect', destination: WAITLIST_PUBLIC_LANDING_PATH };
  }

  if (pathname === '/') {
    return { action: 'redirect', destination: WAITLIST_PUBLIC_LANDING_PATH };
  }

  if (chrisBookingEnabled && isChrisJoinRedirectPath(pathname)) {
    return { action: 'redirect', destination: CHRIS_CAMPAIGN_LANDING_PATH };
  }

  if (chrisBookingEnabled && isWaitlistExpertsPage(pathname)) {
    return { action: 'redirect', destination: CHRIS_CAMPAIGN_LANDING_PATH };
  }

  if (chrisBookingEnabled && isChrisBookingPageRoute(pathname)) {
    return { action: 'allow' };
  }

  if (isWaitlistPublicPage(pathname, chrisBookingEnabled)) {
    return { action: 'allow' };
  }

  if (isWaitlistAdminPage(pathname) && session?.role === 'admin') {
    return { action: 'allow' };
  }

  return { action: 'redirect', destination: WAITLIST_PUBLIC_LANDING_PATH };
}