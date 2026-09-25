import 'server-only';

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

export function isGuestInvitePage(pathname: string): boolean {
  return pathname === '/invite' || pathname.startsWith('/invite/');
}

export function isWaitlistPublicPage(pathname: string): boolean {
  return (
    pathname === WAITLIST_PUBLIC_LANDING_PATH ||
    (WAITLIST_PUBLIC_PAGES as readonly string[]).includes(pathname) ||
    isWaitlistExpertsPage(pathname) ||
    isWaitlistSeoCrawlPage(pathname) ||
    isPathAssessmentPublicPage(pathname) ||
    isGuestInvitePage(pathname)
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
  if (pathname === '/api/guest-invites/claim') return true;
  if (pathname.startsWith('/api/admin/')) return true;
  if (pathname.startsWith('/api/webhooks/')) return true;
  return false;
}

export function resolveWaitlistRoute(
  pathname: string,
  session: { role: string } | null,
): WaitlistRouteDecision {
  if (pathname.startsWith('/api/')) {
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

  if (isWaitlistPublicPage(pathname)) {
    return { action: 'allow' };
  }

  if (isWaitlistAdminPage(pathname) && session?.role === 'admin') {
    return { action: 'allow' };
  }

  return { action: 'redirect', destination: WAITLIST_PUBLIC_LANDING_PATH };
}