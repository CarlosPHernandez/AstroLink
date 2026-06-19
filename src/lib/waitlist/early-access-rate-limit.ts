import 'server-only';

import { assertEarlyAccessDurableRateLimits } from '@/lib/waitlist/early-access-durable-rate-limit';

export class EarlyAccessRateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = 'EarlyAccessRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

type RateLimitWindow = {
  limit: number;
  windowMs: number;
  label: string;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value?.trim()) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isRateLimitEnabled(): boolean {
  const flag = process.env.EARLY_ACCESS_RATE_LIMIT_ENABLED?.trim().toLowerCase();
  if (flag === 'false' || flag === '0') {
    return false;
  }
  return true;
}

function isDurableRateLimitEnabled(): boolean {
  const flag = process.env.EARLY_ACCESS_DURABLE_RATE_LIMIT?.trim().toLowerCase();
  if (flag === 'false' || flag === '0') {
    return false;
  }
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

function getIpWindows(): RateLimitWindow[] {
  return [
    {
      label: 'minute',
      limit: parsePositiveInt(process.env.EARLY_ACCESS_MAX_REQUESTS_PER_MINUTE, 5),
      windowMs: 60_000,
    },
    {
      label: 'hour',
      limit: parsePositiveInt(process.env.EARLY_ACCESS_MAX_REQUESTS_PER_HOUR, 30),
      windowMs: 60 * 60_000,
    },
  ];
}

function getEmailWindows(): RateLimitWindow[] {
  return [
    {
      label: 'hour',
      limit: parsePositiveInt(process.env.EARLY_ACCESS_MAX_REQUESTS_PER_EMAIL_HOUR, 3),
      windowMs: 60 * 60_000,
    },
  ];
}

const hitTimestamps = new Map<string, number[]>();

function bucketKey(windowLabel: string, clientKey: string): string {
  return `${windowLabel}:${clientKey}`;
}

function pruneTimestamps(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((timestamp) => now - timestamp < windowMs);
}

function tryConsumeWindows(
  clientKey: string,
  windows: RateLimitWindow[],
  now: number,
): { allowed: true } | { allowed: false; retryAfterMs: number; limit: number; label: string } {
  const pendingUpdates: Array<{ key: string; timestamps: number[] }> = [];

  for (const window of windows) {
    const key = bucketKey(window.label, clientKey);
    const existing = hitTimestamps.get(key) ?? [];
    const pruned = pruneTimestamps(existing, window.windowMs, now);

    if (pruned.length >= window.limit) {
      const oldest = pruned[0] ?? now;
      return {
        allowed: false,
        retryAfterMs: Math.max(window.windowMs - (now - oldest), 1),
        limit: window.limit,
        label: window.label,
      };
    }

    pendingUpdates.push({ key, timestamps: [...pruned, now] });
  }

  for (const update of pendingUpdates) {
    hitTimestamps.set(update.key, update.timestamps);
  }

  return { allowed: true };
}

export function getEarlyAccessClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

function assertInMemoryRateLimit(clientKey: string, email?: string): void {
  const now = Date.now();
  const ipResult = tryConsumeWindows(clientKey || 'unknown', getIpWindows(), now);
  if (!ipResult.allowed) {
    throw new EarlyAccessRateLimitError(
      `Too many signup attempts. Try again in ${Math.ceil(ipResult.retryAfterMs / 1000)} seconds.`,
      ipResult.retryAfterMs,
    );
  }

  if (email) {
    const emailResult = tryConsumeWindows(
      `email:${email.toLowerCase()}`,
      getEmailWindows(),
      now,
    );
    if (!emailResult.allowed) {
      throw new EarlyAccessRateLimitError(
        `Too many signup attempts for this email. Try again in ${Math.ceil(emailResult.retryAfterMs / 1000)} seconds.`,
        emailResult.retryAfterMs,
      );
    }
  }
}

export async function assertEarlyAccessRateLimit(
  request: Request,
  email?: string,
): Promise<void> {
  if (!isRateLimitEnabled()) {
    return;
  }

  const clientKey = getEarlyAccessClientKey(request);

  if (isDurableRateLimitEnabled()) {
    try {
      await assertEarlyAccessDurableRateLimits({
        clientKey,
        email,
        ipWindows: getIpWindows().map((window) => ({
          label: window.label,
          limit: window.limit,
          windowSeconds: Math.ceil(window.windowMs / 1000),
        })),
        emailWindows: getEmailWindows().map((window) => ({
          label: window.label,
          limit: window.limit,
          windowSeconds: Math.ceil(window.windowMs / 1000),
        })),
      });
      return;
    } catch (error) {
      if (error instanceof EarlyAccessRateLimitError) {
        throw error;
      }
      console.warn(
        '[early-access] Durable rate limit unavailable; falling back to in-memory limit.',
        error instanceof Error ? error.message : error,
      );
    }
  }

  assertInMemoryRateLimit(clientKey, email);
}

export function isEarlyAccessRateLimitError(error: unknown): error is EarlyAccessRateLimitError {
  return error instanceof EarlyAccessRateLimitError;
}