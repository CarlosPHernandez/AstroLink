import 'server-only';

export type AppMode = 'full' | 'waitlist';

/** Product surface: full app vs public waitlist-only landing. */
export function getAppMode(): AppMode {
  const mode = process.env.APP_MODE?.trim().toLowerCase();
  if (mode === 'waitlist') {
    return 'waitlist';
  }
  return 'full';
}

export function isWaitlistMode(): boolean {
  return getAppMode() === 'waitlist';
}

/**
 * Mock cookie auth (presets, email heuristics). Off in waitlist production;
 * enable on preview/staging for ops (`ENABLE_DEMO_AUTH=true`).
 */
export function isDemoAuthEnabled(): boolean {
  const flag = process.env.ENABLE_DEMO_AUTH?.trim().toLowerCase();
  if (flag === 'true' || flag === '1') {
    return true;
  }
  if (flag === 'false' || flag === '0') {
    return false;
  }
  return !isWaitlistMode();
}

/** Optional allowlist for admin sessions when demo auth is on (comma-separated emails). */
export function isAdminEmailAllowed(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) {
    return true;
  }
  const allowed = raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

export function isProtectedAppSurfaceEnabled(): boolean {
  return !isWaitlistMode() || isDemoAuthEnabled();
}

/** Real Supabase Auth (email, phone, OAuth). Off when demo cookie auth is on. */
export function isSupabaseAuthEnabled(): boolean {
  return isProtectedAppSurfaceEnabled() && !isDemoAuthEnabled();
}
