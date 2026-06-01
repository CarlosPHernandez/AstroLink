import 'server-only';

export class LlmRateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = 'LlmRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

type RateLimitWindow = {
  limit: number;
  windowMs: number;
  label: string;
};

type RateLimitScope = 'global' | 'user';

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value?.trim()) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isRateLimitEnabled(): boolean {
  const flag = process.env.LLM_RATE_LIMIT_ENABLED?.trim().toLowerCase();
  if (flag === 'false' || flag === '0') {
    return false;
  }
  return true;
}

function getGlobalWindows(): RateLimitWindow[] {
  return [
    {
      label: 'minute',
      limit: parsePositiveInt(process.env.LLM_MAX_REQUESTS_PER_MINUTE, 10),
      windowMs: 60_000,
    },
    {
      label: 'hour',
      limit: parsePositiveInt(process.env.LLM_MAX_REQUESTS_PER_HOUR, 60),
      windowMs: 60 * 60_000,
    },
    {
      label: 'day',
      limit: parsePositiveInt(process.env.LLM_MAX_REQUESTS_PER_DAY, 200),
      windowMs: 24 * 60 * 60_000,
    },
  ];
}

function getUserWindows(): RateLimitWindow[] {
  return [
    {
      label: 'hour',
      limit: parsePositiveInt(process.env.LLM_MAX_REQUESTS_PER_USER_HOUR, 5),
      windowMs: 60 * 60_000,
    },
    {
      label: 'day',
      limit: parsePositiveInt(process.env.LLM_MAX_REQUESTS_PER_USER_DAY, 15),
      windowMs: 24 * 60 * 60_000,
    },
  ];
}

const hitTimestamps = new Map<string, number[]>();

function bucketKey(scope: RateLimitScope, windowLabel: string, subjectKey: string): string {
  return `${scope}:${windowLabel}:${subjectKey}`;
}

function pruneTimestamps(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((timestamp) => now - timestamp < windowMs);
}

function tryConsumeWindows(
  scope: RateLimitScope,
  subjectKey: string,
  windows: RateLimitWindow[],
  now: number,
): { allowed: true } | { allowed: false; retryAfterMs: number; limit: number; label: string } {
  const pendingUpdates: Array<{ key: string; timestamps: number[] }> = [];

  for (const window of windows) {
    const key = bucketKey(scope, window.label, subjectKey);
    const timestamps = pruneTimestamps(hitTimestamps.get(key) ?? [], window.windowMs, now);

    if (timestamps.length >= window.limit) {
      const oldest = timestamps[0] ?? now;
      return {
        allowed: false,
        retryAfterMs: Math.max(window.windowMs - (now - oldest), 1_000),
        limit: window.limit,
        label: window.label,
      };
    }

    pendingUpdates.push({ key, timestamps: [...timestamps, now] });
  }

  for (const update of pendingUpdates) {
    hitTimestamps.set(update.key, update.timestamps);
  }

  return { allowed: true };
}

/**
 * Enforces global and optional per-user LLM request limits before provider calls.
 */
export function assertLlmRateLimit(rateLimitKey?: string): void {
  if (!isRateLimitEnabled()) {
    return;
  }

  const now = Date.now();

  const globalResult = tryConsumeWindows('global', 'api-key', getGlobalWindows(), now);
  if (!globalResult.allowed) {
    throw new LlmRateLimitError(
      `LLM rate limit reached (${globalResult.limit} requests per ${globalResult.label} across the app). Try again in ${Math.ceil(globalResult.retryAfterMs / 1000)}s.`,
      globalResult.retryAfterMs,
    );
  }

  if (!rateLimitKey?.trim()) {
    return;
  }

  const userResult = tryConsumeWindows('user', rateLimitKey.trim(), getUserWindows(), now);
  if (!userResult.allowed) {
    throw new LlmRateLimitError(
      `LLM rate limit reached for this account (${userResult.limit} requests per ${userResult.label}). Try again in ${Math.ceil(userResult.retryAfterMs / 1000)}s.`,
      userResult.retryAfterMs,
    );
  }
}

export function isLlmRateLimitError(error: unknown): error is LlmRateLimitError {
  return error instanceof LlmRateLimitError;
}
