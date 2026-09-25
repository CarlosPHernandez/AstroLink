import 'server-only';

type Bucket = { timestamps: number[] };

const hits = new Map<string, Bucket>();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export class GuestInviteRateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = 'GuestInviteRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

function consume(key: string, limit: number, windowMs: number, now: number): number | null {
  const bucket = hits.get(key) ?? { timestamps: [] };
  const pruned = bucket.timestamps.filter((ts) => now - ts < windowMs);
  if (pruned.length >= limit) {
    const oldest = pruned[0] ?? now;
    hits.set(key, { timestamps: pruned });
    return Math.max(windowMs - (now - oldest), 1);
  }
  pruned.push(now);
  hits.set(key, { timestamps: pruned });
  return null;
}

export function guestInviteClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (first) return first;
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function assertGuestInviteLookupRateLimit(ip: string, now = Date.now()): void {
  const limit = parsePositiveInt(process.env.GUEST_INVITE_MAX_LOOKUPS_PER_IP_HOUR, 30);
  const retry = consume(`lookup:${ip}`, limit, 60 * 60_000, now);
  if (retry != null) {
    throw new GuestInviteRateLimitError('Try again shortly.', retry);
  }
}

export function assertGuestInviteClaimRateLimit(
  ip: string,
  userId: string,
  now = Date.now(),
): void {
  const limit = parsePositiveInt(process.env.GUEST_INVITE_MAX_CLAIMS_PER_HOUR, 5);
  const ipRetry = consume(`claim-ip:${ip}`, limit, 60 * 60_000, now);
  if (ipRetry != null) {
    throw new GuestInviteRateLimitError('Try again shortly.', ipRetry);
  }
  const userRetry = consume(`claim-user:${userId}`, limit, 60 * 60_000, now);
  if (userRetry != null) {
    throw new GuestInviteRateLimitError('Try again shortly.', userRetry);
  }
}

export function isGuestInviteRateLimitError(error: unknown): error is GuestInviteRateLimitError {
  return error instanceof GuestInviteRateLimitError;
}
