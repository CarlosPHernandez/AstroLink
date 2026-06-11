import { afterEach, describe, expect, it, vi } from 'vitest';

describe('getLlmProvider', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses explicit LLM_PROVIDER when set', async () => {
    vi.stubEnv('LLM_PROVIDER', 'gemini');
    vi.stubEnv('OPENAI_API_KEY', 'sk-test');
    const { getLlmProvider } = await import('@/lib/llm');
    expect(getLlmProvider()).toBe('gemini');
  });

  it('defaults to openai when OPENAI_API_KEY is present', async () => {
    vi.stubEnv('LLM_PROVIDER', '');
    vi.stubEnv('OPENAI_API_KEY', 'sk-test');
    const { getLlmProvider } = await import('@/lib/llm');
    expect(getLlmProvider()).toBe('openai');
  });

  it('falls back to gemini without OpenAI key', async () => {
    vi.stubEnv('LLM_PROVIDER', '');
    vi.stubEnv('OPENAI_API_KEY', '');
    const { getLlmProvider } = await import('@/lib/llm');
    expect(getLlmProvider()).toBe('gemini');
  });
});

describe('callLlmWithBackoff', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('rethrows LlmRateLimitError without wrapping it as a generic Error', async () => {
    vi.stubEnv('LLM_RATE_LIMIT_ENABLED', 'false');
    const { callLlmWithBackoff, LlmRateLimitError } = await import('@/lib/llm');
    const rateLimitError = new LlmRateLimitError('Caption translation rate limit reached', 5_000);

    await expect(
      callLlmWithBackoff(async () => {
        throw rateLimitError;
      }, 0),
    ).rejects.toBe(rateLimitError);
  });
});
