import 'server-only';
import { isChrisBookingSurfaceEnabled, isProtectedAppSurfaceEnabled } from '@/lib/app-mode';
import type { SessionData } from '@/lib/session';
import { WAITLIST_PUBLIC_LANDING_PATH } from '@/lib/waitlist/waitlist-landing';

/**
 * Auth subpaths that may appear in `?next=` after email links (password recovery, etc.).
 * Other `/auth/*` targets stay blocked to prevent open-redirect loops through auth.
 */
export const ALLOWED_AUTH_NEXT_PATHS = [
  '/auth/update-password',
  '/auth/complete-profile',
] as const;

export function isPasswordRecoveryNextPath(path: string): boolean {
  const pathOnly = path.split('?')[0]?.toLowerCase() ?? '';
  return pathOnly === '/auth/update-password';
}

/** Same-origin relative path only; blocks open redirects. */
export function getSafeRedirectPath(
  raw: string | null | undefined,
  fallback: string,
): string {
  if (!raw || typeof raw !== 'string') {
    return fallback;
  }

  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  if (trimmed.includes('://') || trimmed.toLowerCase().startsWith('http:') || trimmed.toLowerCase().startsWith('https:')) {
    return fallback;
  }

  const pathOnly = trimmed.split('?')[0] ?? trimmed;
  const lowerPath = pathOnly.toLowerCase();

  if (lowerPath.startsWith('/auth')) {
    const allowed = (ALLOWED_AUTH_NEXT_PATHS as readonly string[]).includes(lowerPath);
    return allowed ? pathOnly : fallback;
  }

  return trimmed;
}

export function getDefaultPathAfterAuth(params: {
  role: SessionData['role'];
  onboarded?: boolean;
}): string {
  if (params.role === 'mentor' && !params.onboarded) {
    return '/onboard';
  }
  if (params.role === 'admin') {
    return '/dashboard/admin';
  }
  if (params.role === 'mentor') {
    return '/dashboard/mentor';
  }
  return '/dashboard/mentee';
}

export function getSignInPath(): string {
  return isProtectedAppSurfaceEnabled() || isChrisBookingSurfaceEnabled()
    ? '/auth'
    : WAITLIST_PUBLIC_LANDING_PATH;
}

export function toAuthWithRedirect(returnPath: string): string {
  const signInPath = getSignInPath();
  if (!returnPath) {
    return signInPath;
  }
  const safe = getSafeRedirectPath(returnPath, '');
  if (!safe) {
    return signInPath;
  }
  if (signInPath === WAITLIST_PUBLIC_LANDING_PATH) {
    return signInPath;
  }
  return `/auth?redirect=${encodeURIComponent(safe)}`;
}
