import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertProductionEnvSafety } from './production-env-guard';

describe('assertProductionEnvSafety', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('no-ops outside Vercel production', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('ENABLE_DEMO_AUTH', 'true');
    expect(() => assertProductionEnvSafety()).not.toThrow();
  });

  it('throws when demo auth is enabled on Vercel production', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('ENABLE_DEMO_AUTH', 'true');
    vi.stubEnv('ENCRYPTION_KEY', 'abc');
    expect(() => assertProductionEnvSafety()).toThrow(/ENABLE_DEMO_AUTH/);
  });

  it('throws when encryption key is missing on Vercel production', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('ENABLE_DEMO_AUTH', 'false');
    vi.stubEnv('ENCRYPTION_KEY', '');
    expect(() => assertProductionEnvSafety()).toThrow(/ENCRYPTION_KEY/);
  });

  it('throws when E2E_STUB_LLM is enabled on Vercel production', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('ENABLE_DEMO_AUTH', 'false');
    vi.stubEnv('ENCRYPTION_KEY', 'abc');
    vi.stubEnv('E2E_STUB_LLM', 'true');
    expect(() => assertProductionEnvSafety()).toThrow(/E2E_STUB_LLM/);
  });

  it('throws when OpenAI would win by default on Vercel production', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('ENABLE_DEMO_AUTH', 'false');
    vi.stubEnv('ENCRYPTION_KEY', 'abc');
    vi.stubEnv('E2E_STUB_LLM', '');
    vi.stubEnv('LLM_PROVIDER', '');
    vi.stubEnv('OPENAI_API_KEY', 'sk-test');
    expect(() => assertProductionEnvSafety()).toThrow(/LLM_PROVIDER/);
  });

  it('allows an explicit OpenAI provider until Gemini billing is ready', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('ENABLE_DEMO_AUTH', 'false');
    vi.stubEnv('ENCRYPTION_KEY', 'abc');
    vi.stubEnv('E2E_STUB_LLM', '');
    vi.stubEnv('LLM_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'sk-test');
    expect(() => assertProductionEnvSafety()).not.toThrow();
  });
});