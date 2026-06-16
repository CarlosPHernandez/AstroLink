import { afterEach, describe, expect, it, vi } from 'vitest';

describe('app-url', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses NEXT_PUBLIC_APP_URL when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://astro-link.space/');
    const { getAppBaseUrl, appAuthPath } = await import('@/lib/app-url');
    expect(getAppBaseUrl()).toBe('https://astro-link.space');
    expect(appAuthPath('/auth/callback')).toBe('https://astro-link.space/auth/callback');
  });

  it('falls back to VERCEL_URL', async () => {
    vi.stubEnv('VERCEL_URL', 'preview.vercel.app');
    const { getAppBaseUrl } = await import('@/lib/app-url');
    expect(getAppBaseUrl()).toBe('https://preview.vercel.app');
  });

  it('uses production app URL when NODE_ENV is production and no env is set', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { getAppBaseUrl } = await import('@/lib/app-url');
    expect(getAppBaseUrl()).toBe('https://astro-link.space');
  });
});