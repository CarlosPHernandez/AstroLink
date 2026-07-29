/**
 * Signed access tokens for private video watch pages.
 * HMAC-SHA256 over base64url JSON payload (ENCRYPTION_KEY) — same family as Chris slot tokens.
 */

import crypto from 'crypto';

export type VideoAccessTokenPayload = {
  v: 1;
  videoRequestId: string;
  email: string;
  /** Unix seconds expiry */
  exp: number;
};

const DEFAULT_TTL_SEC = 60 * 60 * 24 * 90; // 90 days

function getSigningKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY?.trim();
  if (key) {
    return crypto.createHash('sha256').update(`video-access:${key}`).digest();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY is required to sign video access tokens in production');
  }
  return crypto.createHash('sha256').update('dev-fallback-video-access-astrolink').digest();
}

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function createVideoAccessTokenPayload(params: {
  videoRequestId: string;
  email: string;
  ttlSec?: number;
  nowSec?: number;
}): VideoAccessTokenPayload {
  const now = params.nowSec ?? Math.floor(Date.now() / 1000);
  return {
    v: 1,
    videoRequestId: params.videoRequestId.trim(),
    email: params.email.trim().toLowerCase(),
    exp: now + (params.ttlSec ?? DEFAULT_TTL_SEC),
  };
}

export function signVideoAccessToken(payload: VideoAccessTokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningKey()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyVideoAccessToken(
  token: string,
  options?: { nowSec?: number },
):
  | { ok: true; payload: VideoAccessTokenPayload }
  | { ok: false; reason: 'malformed' | 'bad_sig' | 'expired' | 'invalid_payload' } {
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, reason: 'malformed' };
  }
  const [body, sig] = parts;
  const expected = crypto.createHmac('sha256', getSigningKey()).update(body).digest('base64url');
  if (!timingSafeEqualString(sig, expected)) {
    return { ok: false, reason: 'bad_sig' };
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as VideoAccessTokenPayload;
    if (
      parsed?.v !== 1 ||
      typeof parsed.videoRequestId !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.exp !== 'number'
    ) {
      return { ok: false, reason: 'invalid_payload' };
    }
    const now = options?.nowSec ?? Math.floor(Date.now() / 1000);
    if (parsed.exp < now) {
      return { ok: false, reason: 'expired' };
    }
    return { ok: true, payload: parsed };
  } catch {
    return { ok: false, reason: 'invalid_payload' };
  }
}

export function buildVideoWatchPath(token: string): string {
  return `/video-requests/view?t=${encodeURIComponent(token)}`;
}
