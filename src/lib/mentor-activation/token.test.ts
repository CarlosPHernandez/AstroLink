import { describe, expect, it } from 'vitest';

import {
  defaultClaimExpiry,
  generateClaimTokenRaw,
  hashClaimToken,
  isClaimExpired,
} from '@/lib/mentor-activation/token';

describe('mentor claim tokens', () => {
  it('generates unique high-entropy tokens', () => {
    const a = generateClaimTokenRaw();
    const b = generateClaimTokenRaw();
    expect(a).not.toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });

  it('hashes deterministically and differs from raw', () => {
    const raw = 'test-token-value';
    const h1 = hashClaimToken(raw);
    const h2 = hashClaimToken(raw);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(raw);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('detects expiry', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const future = defaultClaimExpiry(1).toISOString();
    expect(isClaimExpired(past)).toBe(true);
    expect(isClaimExpired(future)).toBe(false);
  });
});
