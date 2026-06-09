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

/** Supabase publishable credentials present (required for real sign-up/sign-in). */
export function isSupabaseAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
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

/** Production mentee accounts via Supabase Auth (demo auth takes precedence when enabled). */
export function isSupabaseAuthEnabled(): boolean {
  if (!isSupabaseAuthConfigured()) {
    return false;
  }
  return !isDemoAuthEnabled();
}

/** Whether login/register server actions should accept submissions. */
export function isAccountAuthAvailable(): boolean {
  return isDemoAuthEnabled() || isSupabaseAuthEnabled();
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
