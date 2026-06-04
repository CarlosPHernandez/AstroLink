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

  it('enforces ADMIN_EMAILS when set', async () => {
    vi.stubEnv('ADMIN_EMAILS', 'ops@astrolink.ai, admin@astrolink.ai');
    const { isAdminEmailAllowed } = await import('@/lib/app-mode');
    expect(isAdminEmailAllowed('ops@astrolink.ai')).toBe(true);
    expect(isAdminEmailAllowed('other@example.com')).toBe(false);
  });
});
