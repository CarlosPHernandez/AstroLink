import 'server-only';
import type { SessionData } from '@/lib/session';

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

export function toAuthWithRedirect(returnPath: string): string {
  if (!returnPath) {
    return '/auth';
  }
  const safe = getSafeRedirectPath(returnPath, '');
  if (!safe) {
    return '/auth';
  }
  return `/auth?redirect=${encodeURIComponent(safe)}`;
}
