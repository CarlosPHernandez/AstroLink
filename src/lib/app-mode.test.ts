import { afterEach, describe, expect, it, vi } from 'vitest';

describe('app-mode', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('defaults to full app mode', async () => {
    const { getAppMode, isDemoAuthEnabled } = await import('@/lib/app-mode');
    expect(getAppMode()).toBe('full');
    expect(isDemoAuthEnabled()).toBe(true);
  });

  it('waitlist mode disables demo auth by default', async () => {
    vi.stubEnv('APP_MODE', 'waitlist');
    const { isWaitlistMode, isDemoAuthEnabled, isProtectedAppSurfaceEnabled } = await import(
      '@/lib/app-mode',
    );
    expect(isWaitlistMode()).toBe(true);
    expect(isDemoAuthEnabled()).toBe(false);
    expect(isProtectedAppSurfaceEnabled()).toBe(false);
  });

  it('honors ENABLE_DEMO_AUTH on waitlist deployments', async () => {
    vi.stubEnv('APP_MODE', 'waitlist');
    vi.stubEnv('ENABLE_DEMO_AUTH', 'true');
    const { isDemoAuthEnabled, isProtectedAppSurfaceEnabled } = await import('@/lib/app-mode');
    expect(isDemoAuthEnabled()).toBe(true);
    expect(isProtectedAppSurfaceEnabled()).toBe(true);
  });

  it('enables Supabase auth when demo auth is off and keys are set', async () => {
    vi.stubEnv('APP_MODE', 'full');
    vi.stubEnv('ENABLE_DEMO_AUTH', 'false');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    const { isSupabaseAuthEnabled, isAccountAuthAvailable, isDemoAuthEnabled } = await import(
      '@/lib/app-mode',
    );
    expect(isDemoAuthEnabled()).toBe(false);
    expect(isSupabaseAuthEnabled()).toBe(true);
    expect(isAccountAuthAvailable()).toBe(true);
  });

  it('prefers demo auth over Supabase when both could apply', async () => {
    vi.stubEnv('ENABLE_DEMO_AUTH', 'true');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    const { isSupabaseAuthEnabled, isDemoAuthEnabled } = await import('@/lib/app-mode');
    expect(isDemoAuthEnabled()).toBe(true);
    expect(isSupabaseAuthEnabled()).toBe(false);
  });

  it('enforces ADMIN_EMAILS when set', async () => {
    vi.stubEnv('ADMIN_EMAILS', 'ops@astrolink.ai, admin@astrolink.ai');
    const { isAdminEmailAllowed } = await import('@/lib/app-mode');
    expect(isAdminEmailAllowed('ops@astrolink.ai')).toBe(true);
    expect(isAdminEmailAllowed('other@example.com')).toBe(false);
  });
});
