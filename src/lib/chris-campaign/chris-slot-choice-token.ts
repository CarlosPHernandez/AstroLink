/**
 * Stateless signed tokens for Chris 45-min slot reschedule links.
 * HMAC-SHA256 over base64url JSON payload (ENCRYPTION_KEY).
 */

import crypto from 'crypto';

/** Mirrors ChrisAvailabilityBlock — duplicated so this file has no runtime imports (ops CLI). */
export type ChrisSlotTokenBlock = {
  dayKey: 'tue' | 'thu' | 'fri';
  isoDate: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

export type ChrisSlotTokenPayload = {
  v: 1;
  bookingId: string;
  email: string;
  /** Unix seconds expiry. */
  exp: number;
  blocks: ChrisSlotTokenBlock[];
};

const DEFAULT_TTL_SEC = 60 * 60 * 24 * 14; // 14 days

function getSigningKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY?.trim();
  if (key) {
    return crypto.createHash('sha256').update(key).digest();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY is required to sign Chris slot tokens in production');
  }
  return crypto.createHash('sha256').update('dev-fallback-secret-key-astrolink').digest();
}

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function createChrisSlotTokenPayload(params: {
  bookingId: string;
  email: string;
  blocks: ChrisSlotTokenBlock[];
  ttlSec?: number;
  nowSec?: number;
}): ChrisSlotTokenPayload {
  const now = params.nowSec ?? Math.floor(Date.now() / 1000);
  const ttl = params.ttlSec ?? DEFAULT_TTL_SEC;
  return {
    v: 1,
    bookingId: params.bookingId.trim(),
    email: params.email.trim().toLowerCase(),
    exp: now + ttl,
    blocks: params.blocks,
  };
}

export function signChrisSlotToken(payload: ChrisSlotTokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningKey()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyChrisSlotToken(
  token: string,
  options?: { nowSec?: number },
):
  | { ok: true; payload: ChrisSlotTokenPayload }
  | { ok: false; reason: 'malformed' | 'bad_sig' | 'expired' | 'invalid_payload' } {
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, reason: 'malformed' };
  }
  const [body, sig] = parts;
  const expected = crypto
    .createHmac('sha256', getSigningKey())
    .update(body)
    .digest('base64url');
  if (!timingSafeEqualString(sig, expected)) {
    return { ok: false, reason: 'bad_sig' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'invalid_payload' };
  }

  if (!isPayload(parsed)) {
    return { ok: false, reason: 'invalid_payload' };
  }

  const now = options?.nowSec ?? Math.floor(Date.now() / 1000);
  if (parsed.exp < now) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, payload: parsed };
}

function isPayload(value: unknown): value is ChrisSlotTokenPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (v.v !== 1) return false;
  if (typeof v.bookingId !== 'string' || !v.bookingId.trim()) return false;
  if (typeof v.email !== 'string' || !v.email.includes('@')) return false;
  if (typeof v.exp !== 'number' || !Number.isFinite(v.exp)) return false;
  if (!Array.isArray(v.blocks) || v.blocks.length === 0) return false;
  for (const b of v.blocks) {
    if (!b || typeof b !== 'object') return false;
    const block = b as Record<string, unknown>;
    if (block.dayKey !== 'tue' && block.dayKey !== 'thu' && block.dayKey !== 'fri') {
      return false;
    }
    if (typeof block.isoDate !== 'string') return false;
    for (const k of ['startHour', 'startMinute', 'endHour', 'endMinute'] as const) {
      if (typeof block[k] !== 'number') return false;
    }
  }
  return true;
}
