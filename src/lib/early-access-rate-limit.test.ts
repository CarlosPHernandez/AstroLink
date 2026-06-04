import { afterEach, describe, expect, it, vi } from 'vitest';

describe('assertEarlyAccessRateLimit', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('no-ops when rate limiting is disabled', async () => {
    vi.stubEnv('EARLY_ACCESS_RATE_LIMIT_ENABLED', 'false');
    const { assertEarlyAccessRateLimit } = await import('@/lib/early-access-rate-limit');
    expect(() => assertEarlyAccessRateLimit('1.2.3.4')).not.toThrow();
  });

  it('throws when per-minute cap is exceeded', async () => {
    vi.stubEnv('EARLY_ACCESS_MAX_REQUESTS_PER_MINUTE', '1');
    const { assertEarlyAccessRateLimit, EarlyAccessRateLimitError } = await import(
      '@/lib/early-access-rate-limit',
    );

    assertEarlyAccessRateLimit('client-a');
    expect(() => assertEarlyAccessRateLimit('client-a')).toThrow(EarlyAccessRateLimitError);
  });
});
