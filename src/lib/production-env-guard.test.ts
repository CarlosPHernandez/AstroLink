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
});