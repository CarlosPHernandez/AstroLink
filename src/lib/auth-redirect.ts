import 'server-only';
import { isChrisBookingSurfaceEnabled, isProtectedAppSurfaceEnabled } from '@/lib/app-mode';
import type { SessionData } from '@/lib/session';
import { WAITLIST_PUBLIC_LANDING_PATH } from '@/lib/waitlist/waitlist-landing';

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

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('/auth')) {
    return fallback;
  }

  if (trimmed.includes('://') || lower.startsWith('http:') || lower.startsWith('https:')) {
    return fallback;
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
