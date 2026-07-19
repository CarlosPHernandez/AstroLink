import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('landing relay rate limit', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('LANDING_RELAY_RATE_LIMIT_ENABLED', 'true');
    vi.stubEnv('LANDING_RELAY_MAX_REQUESTS_PER_IP_MINUTE', '2');
    vi.stubEnv('LANDING_RELAY_MAX_REQUESTS_PER_IP_HOUR', '10');
    vi.stubEnv('LANDING_RELAY_MAX_REQUESTS_PER_IP_DAY', '20');
    vi.stubEnv('LANDING_RELAY_MAX_REQUESTS_PER_MINUTE', '100');
    vi.stubEnv('LANDING_RELAY_MAX_REQUESTS_PER_HOUR', '1000');
    vi.stubEnv('LANDING_RELAY_MAX_REQUESTS_PER_DAY', '5000');
    vi.stubEnv('LANDING_RELAY_LLM_MAX_PER_IP_MINUTE', '1');
    vi.stubEnv('LANDING_RELAY_LLM_MAX_PER_IP_HOUR', '4');
    vi.stubEnv('LANDING_RELAY_LLM_MAX_PER_IP_DAY', '10');
    vi.stubEnv('LANDING_RELAY_LLM_MAX_GLOBAL_HOUR', '100');
    vi.stubEnv('LANDING_RELAY_LLM_MAX_GLOBAL_DAY', '500');
  });

  it('allows then blocks submit bursts per IP', async () => {
    const mod = await import('@/lib/landing/relay-rate-limit');
    mod.__resetLandingRelayRateLimitForTests();

    mod.assertLandingRelaySubmitRateLimit('1.1.1.1');
    mod.assertLandingRelaySubmitRateLimit('1.1.1.1');
    expect(() => mod.assertLandingRelaySubmitRateLimit('1.1.1.1')).toThrow(
      /rate limit/i,
    );
  });

  it('consumes LLM budget independently', async () => {
    const mod = await import('@/lib/landing/relay-rate-limit');
    mod.__resetLandingRelayRateLimitForTests();

    expect(mod.tryConsumeLandingRelayLlmBudget('2.2.2.2')).toBe(true);
    expect(mod.tryConsumeLandingRelayLlmBudget('2.2.2.2')).toBe(false);
  });
});
