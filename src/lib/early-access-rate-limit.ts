import 'server-only';

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

export function assertEarlyAccessRateLimit(clientKey: string): void {
  if (!isRateLimitEnabled()) {
    return;
  }

  const now = Date.now();
  const result = tryConsumeWindows(clientKey || 'unknown', getIpWindows(), now);
  if (!result.allowed) {
    throw new EarlyAccessRateLimitError(
      `Too many signup attempts. Try again in ${Math.ceil(result.retryAfterMs / 1000)} seconds.`,
      result.retryAfterMs,
    );
  }
}

export function isEarlyAccessRateLimitError(error: unknown): error is EarlyAccessRateLimitError {
  return error instanceof EarlyAccessRateLimitError;
}
