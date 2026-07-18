import { afterEach, describe, expect, it } from 'vitest';

import {
  createChrisSlotTokenPayload,
  signChrisSlotToken,
  verifyChrisSlotToken,
} from '@/lib/chris-campaign/chris-slot-choice-token';
import { buildDefaultBlocks } from '@/lib/chris-campaign/chris-availability-slots';

const blocks = buildDefaultBlocks({
  tue: '2026-07-21',
  thu: '2026-07-23',
  fri: '2026-07-24',
});

describe('chris-slot-choice-token', () => {
  const prevKey = process.env.ENCRYPTION_KEY;

  afterEach(() => {
    if (prevKey === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = prevKey;
    }
  });

  it('signs and verifies a valid token', () => {
    process.env.ENCRYPTION_KEY = 'test-key-for-chris-slot-tokens';
    const payload = createChrisSlotTokenPayload({
      bookingId: '11111111-1111-1111-1111-111111111111',
      email: 'Alex@Example.com',
      blocks,
      nowSec: 1_700_000_000,
      ttlSec: 3600,
    });
    expect(payload.email).toBe('alex@example.com');
    const token = signChrisSlotToken(payload);
    const result = verifyChrisSlotToken(token, { nowSec: 1_700_000_100 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.bookingId).toBe(payload.bookingId);
      expect(result.payload.blocks).toHaveLength(3);
    }
  });

  it('rejects tampered tokens', () => {
    process.env.ENCRYPTION_KEY = 'test-key-for-chris-slot-tokens';
    const payload = createChrisSlotTokenPayload({
      bookingId: 'b1',
      email: 'a@b.com',
      blocks,
    });
    const token = signChrisSlotToken(payload);
    const [body] = token.split('.');
    const bad = `${body}.fakesignaturepaddingxx`;
    expect(verifyChrisSlotToken(bad).ok).toBe(false);
  });

  it('rejects expired tokens', () => {
    process.env.ENCRYPTION_KEY = 'test-key-for-chris-slot-tokens';
    const payload = createChrisSlotTokenPayload({
      bookingId: 'b1',
      email: 'a@b.com',
      blocks,
      nowSec: 1_000,
      ttlSec: 60,
    });
    const token = signChrisSlotToken(payload);
    const result = verifyChrisSlotToken(token, { nowSec: 1_100 });
    expect(result).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejects malformed tokens', () => {
    expect(verifyChrisSlotToken('not-a-token')).toEqual({
      ok: false,
      reason: 'malformed',
    });
  });
});
