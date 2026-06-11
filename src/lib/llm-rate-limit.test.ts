import { afterEach, describe, expect, it, vi } from 'vitest';

describe('assertLlmRateLimit', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('no-ops when rate limiting is disabled', async () => {
    vi.stubEnv('LLM_RATE_LIMIT_ENABLED', 'false');
    const { assertLlmRateLimit } = await import('@/lib/llm-rate-limit');
    expect(() => assertLlmRateLimit('user-1')).not.toThrow();
  });

  it('allows requests under the global minute cap', async () => {
    vi.stubEnv('LLM_MAX_REQUESTS_PER_MINUTE', '3');
    vi.stubEnv('LLM_MAX_REQUESTS_PER_HOUR', '100');
    vi.stubEnv('LLM_MAX_REQUESTS_PER_DAY', '1000');
    vi.stubEnv('LLM_MAX_REQUESTS_PER_USER_HOUR', '100');
    vi.stubEnv('LLM_MAX_REQUESTS_PER_USER_DAY', '1000');

    const { assertLlmRateLimit } = await import('@/lib/llm-rate-limit');
    assertLlmRateLimit();
    assertLlmRateLimit();
    expect(() => assertLlmRateLimit()).not.toThrow();
  });

  it('throws LlmRateLimitError when global minute cap is exceeded', async () => {
    vi.stubEnv('LLM_MAX_REQUESTS_PER_MINUTE', '1');
    vi.stubEnv('LLM_MAX_REQUESTS_PER_HOUR', '100');
    vi.stubEnv('LLM_MAX_REQUESTS_PER_DAY', '1000');

    const { assertLlmRateLimit, LlmRateLimitError, isLlmRateLimitError } = await import(
      '@/lib/llm-rate-limit'
    );

    assertLlmRateLimit();
    expect(() => assertLlmRateLimit()).toThrow(LlmRateLimitError);

    try {
      assertLlmRateLimit();
    } catch (error) {
      expect(isLlmRateLimitError(error)).toBe(true);
      if (error instanceof LlmRateLimitError) {
        expect(error.retryAfterMs).toBeGreaterThan(0);
        expect(error.message).toMatch(/rate limit reached/i);
      }
    }
  });

  it('uses separate caption windows that do not consume default user limits', async () => {
    vi.stubEnv('LLM_MAX_REQUESTS_PER_MINUTE', '100');
    vi.stubEnv('LLM_MAX_REQUESTS_PER_HOUR', '100');
    vi.stubEnv('LLM_MAX_REQUESTS_PER_DAY', '1000');
    vi.stubEnv('LLM_MAX_REQUESTS_PER_USER_HOUR', '1');
    vi.stubEnv('LLM_MAX_REQUESTS_PER_USER_DAY', '1000');
    vi.stubEnv('LLM_MAX_CAPTION_REQUESTS_PER_MINUTE', '100');
    vi.stubEnv('LLM_MAX_CAPTION_REQUESTS_PER_HOUR', '100');
    vi.stubEnv('LLM_MAX_CAPTION_REQUESTS_PER_DAY', '1000');

    const { assertLlmRateLimit } = await import('@/lib/llm-rate-limit');

    assertLlmRateLimit('mentee-a');
    expect(() => assertLlmRateLimit('mentee-a')).toThrow();
    expect(() => assertLlmRateLimit('mentee-a', { scope: 'caption' })).not.toThrow();
  });

  it('enforces per-user limits when rateLimitKey is provided', async () => {
    vi.stubEnv('LLM_MAX_REQUESTS_PER_MINUTE', '100');
    vi.stubEnv('LLM_MAX_REQUESTS_PER_HOUR', '100');
    vi.stubEnv('LLM_MAX_REQUESTS_PER_DAY', '1000');
    vi.stubEnv('LLM_MAX_REQUESTS_PER_USER_HOUR', '1');
    vi.stubEnv('LLM_MAX_REQUESTS_PER_USER_DAY', '1000');

    const { assertLlmRateLimit, LlmRateLimitError } = await import('@/lib/llm-rate-limit');

    assertLlmRateLimit('mentee-a');
    expect(() => assertLlmRateLimit('mentee-a')).toThrow(LlmRateLimitError);
    expect(() => assertLlmRateLimit('mentee-b')).not.toThrow();
  });
});
