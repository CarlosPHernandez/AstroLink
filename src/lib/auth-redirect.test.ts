import { afterEach, describe, expect, it, vi } from 'vitest';

describe('auth-redirect (Chris booking surface)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('routes sign-in to /auth when Chris booking is enabled in waitlist mode', async () => {
    vi.stubEnv('APP_MODE', 'waitlist');
    vi.stubEnv('ENABLE_DEMO_AUTH', 'false');
    vi.stubEnv('CHRIS_BOOKING_ENABLED', 'true');
    const { getSignInPath } = await import('@/lib/auth-redirect');
    expect(getSignInPath()).toBe('/auth');
  });

  it('routes sign-in to talk-with-chris when waitlist without Chris booking', async () => {
    vi.stubEnv('APP_MODE', 'waitlist');
    vi.stubEnv('ENABLE_DEMO_AUTH', 'false');
    const { getSignInPath } = await import('@/lib/auth-redirect');
    expect(getSignInPath()).toBe('/talk-with-chris');
  });
});

describe('getSafeRedirectPath', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('allows password recovery next path', async () => {
    const { getSafeRedirectPath, isPasswordRecoveryNextPath } = await import(
      '@/lib/auth-redirect'
    );
    expect(getSafeRedirectPath('/auth/update-password', '/dashboard/mentee')).toBe(
      '/auth/update-password',
    );
    expect(isPasswordRecoveryNextPath('/auth/update-password')).toBe(true);
  });

  it('blocks generic /auth loops but allows complete-profile', async () => {
    const { getSafeRedirectPath } = await import('@/lib/auth-redirect');
    expect(getSafeRedirectPath('/auth', '/dashboard/mentee')).toBe('/dashboard/mentee');
    expect(getSafeRedirectPath('/auth/forgot-password', '/dashboard/mentee')).toBe(
      '/dashboard/mentee',
    );
    expect(getSafeRedirectPath('/auth/complete-profile', '/dashboard/mentee')).toBe(
      '/auth/complete-profile',
    );
  });

  it('blocks open redirects', async () => {
    const { getSafeRedirectPath } = await import('@/lib/auth-redirect');
    expect(getSafeRedirectPath('https://evil.example', '/dashboard/mentee')).toBe(
      '/dashboard/mentee',
    );
    expect(getSafeRedirectPath('//evil.example', '/dashboard/mentee')).toBe('/dashboard/mentee');
  });
});
