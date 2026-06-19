import { afterEach, describe, expect, it, vi } from 'vitest';

function makeRequest(): Request {
  return new Request('http://127.0.0.1:3000/api/early-access', {
    method: 'POST',
    headers: { 'x-forwarded-for': '203.0.113.10' },
  });
}

describe('assertEarlyAccessRateLimit', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('no-ops when rate limiting is disabled', async () => {
    vi.stubEnv('EARLY_ACCESS_RATE_LIMIT_ENABLED', 'false');
    const { assertEarlyAccessRateLimit } = await import('@/lib/waitlist/early-access-rate-limit');
    await expect(assertEarlyAccessRateLimit(makeRequest())).resolves.toBeUndefined();
  });

  it('throws when per-minute cap is exceeded (in-memory fallback)', async () => {
    vi.stubEnv('EARLY_ACCESS_DURABLE_RATE_LIMIT', 'false');
    vi.stubEnv('EARLY_ACCESS_MAX_REQUESTS_PER_MINUTE', '1');
    const { assertEarlyAccessRateLimit, EarlyAccessRateLimitError } = await import(
      '@/lib/waitlist/early-access-rate-limit'
    );

    const request = makeRequest();
    await assertEarlyAccessRateLimit(request);
    await expect(assertEarlyAccessRateLimit(request)).rejects.toThrow(EarlyAccessRateLimitError);
  });
});