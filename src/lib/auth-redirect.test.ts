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

  it('routes sign-in to /early-access when waitlist without Chris booking', async () => {
    vi.stubEnv('APP_MODE', 'waitlist');
    vi.stubEnv('ENABLE_DEMO_AUTH', 'false');
    const { getSignInPath } = await import('@/lib/auth-redirect');
    expect(getSignInPath()).toBe('/early-access');
  });
});