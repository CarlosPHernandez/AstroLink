import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionData } from '@/lib/session';

const mockCookiesGet = vi.hoisted(() => vi.fn());
const mockCookies = vi.hoisted(() =>
  vi.fn(async () => ({
    get: mockCookiesGet,
    set: vi.fn(),
    delete: vi.fn(),
  })),
);

vi.mock('next/headers', () => ({
  cookies: mockCookies,
}));

function buildSessionPayload(overrides: Partial<SessionData> = {}): SessionData {
  return {
    userId: 'user-1',
    email: 'mentee@astrolink.ai',
    role: 'mentee',
    fullName: 'Test User',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

async function encryptPayload(payload: SessionData): Promise<string> {
  const { encrypt } = await import('@/lib/crypto');
  return encrypt(JSON.stringify(payload));
}

describe('session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ENCRYPTION_KEY', 'test-encryption-key-for-session-tests');
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe('getSession', () => {
    it('returns null when protected surface is disabled', async () => {
      vi.stubEnv('APP_MODE', 'waitlist');
      vi.stubEnv('ENABLE_DEMO_AUTH', 'false');
      const encrypted = await encryptPayload(buildSessionPayload());
      mockCookiesGet.mockReturnValue({ value: encrypted });

      const { getSession } = await import('@/lib/session');
      await expect(getSession()).resolves.toBeNull();
    });

    it('returns null when no cookie is present', async () => {
      mockCookiesGet.mockReturnValue(undefined);

      const { getSession } = await import('@/lib/session');
      await expect(getSession()).resolves.toBeNull();
    });

    it('returns session in full app mode', async () => {
      vi.stubEnv('APP_MODE', 'full');
      const payload = buildSessionPayload();
      const encrypted = await encryptPayload(payload);
      mockCookiesGet.mockReturnValue({ value: encrypted });

      const { getSession } = await import('@/lib/session');
      await expect(getSession()).resolves.toEqual(payload);
    });

    it('returns session in waitlist mode when demo auth is enabled', async () => {
      vi.stubEnv('APP_MODE', 'waitlist');
      vi.stubEnv('ENABLE_DEMO_AUTH', 'true');
      const payload = buildSessionPayload({ role: 'admin' });
      const encrypted = await encryptPayload(payload);
      mockCookiesGet.mockReturnValue({ value: encrypted });

      const { getSession } = await import('@/lib/session');
      await expect(getSession()).resolves.toEqual(payload);
    });
  });

  describe('decryptSessionString', () => {
    it('returns session data for a valid encrypted payload', async () => {
      const payload = buildSessionPayload();
      const encrypted = await encryptPayload(payload);

      const { decryptSessionString } = await import('@/lib/session');
      expect(decryptSessionString(encrypted)).toEqual(payload);
    });

    it('returns null for an expired session', async () => {
      const payload = buildSessionPayload({
        expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
      });
      const encrypted = await encryptPayload(payload);

      const { decryptSessionString } = await import('@/lib/session');
      expect(decryptSessionString(encrypted)).toBeNull();
    });

    it('returns null for tampered ciphertext without throwing', async () => {
      const { decryptSessionString } = await import('@/lib/session');
      expect(decryptSessionString('not-valid-ciphertext')).toBeNull();
    });
  });
});
