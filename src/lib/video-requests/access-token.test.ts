import { describe, expect, it } from 'vitest';
import {
  createVideoAccessTokenPayload,
  signVideoAccessToken,
  verifyVideoAccessToken,
} from '@/lib/video-requests/access-token';

describe('video-requests/access-token', () => {
  it('signs and verifies a valid token', () => {
    const payload = createVideoAccessTokenPayload({
      videoRequestId: '11111111-1111-4111-8111-111111111111',
      email: 'Alex@Example.com',
      nowSec: 1_700_000_000,
      ttlSec: 3600,
    });
    const token = signVideoAccessToken(payload);
    const verified = verifyVideoAccessToken(token, { nowSec: 1_700_000_100 });
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.payload.email).toBe('alex@example.com');
      expect(verified.payload.videoRequestId).toBe(payload.videoRequestId);
    }
  });

  it('rejects expired tokens', () => {
    const payload = createVideoAccessTokenPayload({
      videoRequestId: '11111111-1111-4111-8111-111111111111',
      email: 'a@b.com',
      nowSec: 1_700_000_000,
      ttlSec: 10,
    });
    const token = signVideoAccessToken(payload);
    const verified = verifyVideoAccessToken(token, { nowSec: 1_700_000_020 });
    expect(verified).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejects tampered tokens', () => {
    const payload = createVideoAccessTokenPayload({
      videoRequestId: '11111111-1111-4111-8111-111111111111',
      email: 'a@b.com',
    });
    const token = signVideoAccessToken(payload);
    const [body] = token.split('.');
    const verified = verifyVideoAccessToken(`${body}.deadbeef`);
    expect(verified).toEqual({ ok: false, reason: 'bad_sig' });
  });
});
