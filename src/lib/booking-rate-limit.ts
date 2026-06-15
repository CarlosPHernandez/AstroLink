import 'server-only';

export class BookingRateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = 'BookingRateLimitError';
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

function isRateLimitEnabled(scope: 'booking' | 'cancel'): boolean {
  const flag =
    scope === 'booking'
      ? process.env.BOOKING_RATE_LIMIT_ENABLED
      : process.env.BOOKING_CANCEL_RATE_LIMIT_ENABLED;
  if (flag?.trim().toLowerCase() === 'false' || flag?.trim() === '0') {
    return false;
  }
  return true;
}

function getBookingWindows(): RateLimitWindow[] {
  return [
    {
      label: 'minute',
      limit: parsePositiveInt(process.env.BOOKING_MAX_REQUESTS_PER_MINUTE, 5),
      windowMs: 60_000,
    },
    {
      label: 'hour',
      limit: parsePositiveInt(process.env.BOOKING_MAX_REQUESTS_PER_HOUR, 20),
      windowMs: 60 * 60_000,
    },
  ];
}

function getCancelWindows(): RateLimitWindow[] {
  return [
    {
      label: 'minute',
      limit: parsePositiveInt(process.env.BOOKING_CANCEL_MAX_REQUESTS_PER_MINUTE, 3),
      windowMs: 60_000,
    },
    {
      label: 'hour',
      limit: parsePositiveInt(process.env.BOOKING_CANCEL_MAX_REQUESTS_PER_HOUR, 10),
      windowMs: 60 * 60_000,
    },
  ];
}

const hitTimestamps = new Map<string, number[]>();

function bucketKey(windowLabel: string, clientKey: string, scope: string): string {
  return `${scope}:${windowLabel}:${clientKey}`;
}

function pruneTimestamps(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((timestamp) => now - timestamp < windowMs);
}

function tryConsumeWindows(
  clientKey: string,
  windows: RateLimitWindow[],
  scope: 'booking' | 'cancel',
  now: number,
): { allowed: true } | { allowed: false; retryAfterMs: number; limit: number; label: string } {
  const pendingUpdates: Array<{ key: string; timestamps: number[] }> = [];

  for (const window of windows) {
    const key = bucketKey(window.label, clientKey, scope);
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

export function getBookingClientKey(request: Request, userId?: string | null): string {
  if (userId) {
    return `user:${userId}`;
  }
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

export function assertBookingRateLimit(clientKey: string): void {
  if (!isRateLimitEnabled('booking')) {
    return;
  }

  const now = Date.now();
  const result = tryConsumeWindows(clientKey || 'unknown', getBookingWindows(), 'booking', now);
  if (!result.allowed) {
    throw new BookingRateLimitError(
      `Too many booking attempts. Try again in ${Math.ceil(result.retryAfterMs / 1000)} seconds.`,
      result.retryAfterMs,
    );
  }
}

export function assertBookingCancelRateLimit(clientKey: string): void {
  if (!isRateLimitEnabled('cancel')) {
    return;
  }

  const now = Date.now();
  const result = tryConsumeWindows(clientKey || 'unknown', getCancelWindows(), 'cancel', now);
  if (!result.allowed) {
    throw new BookingRateLimitError(
      `Too many cancellation attempts. Try again in ${Math.ceil(result.retryAfterMs / 1000)} seconds.`,
      result.retryAfterMs,
    );
  }
}

export function isBookingRateLimitError(error: unknown): error is BookingRateLimitError {
  return error instanceof BookingRateLimitError;
}
