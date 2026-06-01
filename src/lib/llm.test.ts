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
