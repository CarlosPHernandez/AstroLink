import 'server-only';

export const WAITLIST_PUBLIC_PAGES = ['/early-access', '/privacy'] as const;

export type WaitlistRouteDecision =
  | { action: 'allow' }
  | { action: 'redirect'; destination: '/early-access' }
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

export function isWaitlistPublicPage(pathname: string): boolean {
  return (
    (WAITLIST_PUBLIC_PAGES as readonly string[]).includes(pathname) ||
    pathname === '/early-access/player' ||
    isWaitlistJoinPage(pathname) ||
    isWaitlistExpertsPage(pathname)
  );
}

export function isWaitlistAdminPage(pathname: string): boolean {
  return pathname === '/dashboard/admin' || pathname.startsWith('/dashboard/admin/');
}

/** API routes that remain reachable in waitlist mode (handlers enforce auth). */
export function isWaitlistAllowedApi(pathname: string): boolean {
  if (pathname === '/api/early-access') return true;
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

  if (pathname === '/') {
    return { action: 'redirect', destination: '/early-access' };
  }

  if (isWaitlistPublicPage(pathname)) {
    return { action: 'allow' };
  }

  if (isWaitlistAdminPage(pathname) && session?.role === 'admin') {
    return { action: 'allow' };
  }

  return { action: 'redirect', destination: '/early-access' };
}