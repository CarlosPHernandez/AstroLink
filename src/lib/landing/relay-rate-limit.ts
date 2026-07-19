import 'server-only';

export class LandingRelayRateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = 'LandingRelayRateLimitError';
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
  const flag = process.env.LANDING_RELAY_RATE_LIMIT_ENABLED?.trim().toLowerCase();
  if (flag === 'false' || flag === '0') {
    return false;
  }
  return true;
}

/** Per-visitor caps (IP key). Tight defaults to protect table + LLM spend. */
function getIpWindows(): RateLimitWindow[] {
  return [
    {
      label: 'minute',
      limit: parsePositiveInt(process.env.LANDING_RELAY_MAX_REQUESTS_PER_IP_MINUTE, 2),
      windowMs: 60_000,
    },
    {
      label: 'hour',
      limit: parsePositiveInt(process.env.LANDING_RELAY_MAX_REQUESTS_PER_IP_HOUR, 8),
      windowMs: 60 * 60_000,
    },
    {
      label: 'day',
      limit: parsePositiveInt(process.env.LANDING_RELAY_MAX_REQUESTS_PER_IP_DAY, 20),
      windowMs: 24 * 60 * 60_000,
    },
  ];
}

/** Site-wide landing budget (isolated from caption/booking LLM quotas). */
function getGlobalLandingWindows(): RateLimitWindow[] {
  return [
    {
      label: 'minute',
      limit: parsePositiveInt(process.env.LANDING_RELAY_MAX_REQUESTS_PER_MINUTE, 20),
      windowMs: 60_000,
    },
    {
      label: 'hour',
      limit: parsePositiveInt(process.env.LANDING_RELAY_MAX_REQUESTS_PER_HOUR, 200),
      windowMs: 60 * 60_000,
    },
    {
      label: 'day',
      limit: parsePositiveInt(process.env.LANDING_RELAY_MAX_REQUESTS_PER_DAY, 500),
      windowMs: 24 * 60 * 60_000,
    },
  ];
}

/** Separate, stricter budget for paid LLM completions only. */
function getLlmWindows(): RateLimitWindow[] {
  return [
    {
      label: 'minute',
      limit: parsePositiveInt(process.env.LANDING_RELAY_LLM_MAX_PER_IP_MINUTE, 1),
      windowMs: 60_000,
    },
    {
      label: 'hour',
      limit: parsePositiveInt(process.env.LANDING_RELAY_LLM_MAX_PER_IP_HOUR, 4),
      windowMs: 60 * 60_000,
    },
    {
      label: 'day',
      limit: parsePositiveInt(process.env.LANDING_RELAY_LLM_MAX_PER_IP_DAY, 10),
      windowMs: 24 * 60 * 60_000,
    },
    {
      label: 'global-hour',
      limit: parsePositiveInt(process.env.LANDING_RELAY_LLM_MAX_GLOBAL_HOUR, 80),
      windowMs: 60 * 60_000,
    },
    {
      label: 'global-day',
      limit: parsePositiveInt(process.env.LANDING_RELAY_LLM_MAX_GLOBAL_DAY, 300),
      windowMs: 24 * 60 * 60_000,
    },
  ];
}

const hitTimestamps = new Map<string, number[]>();

function bucketKey(scope: string, windowLabel: string, subjectKey: string): string {
  return `landing-relay:${scope}:${windowLabel}:${subjectKey}`;
}

function pruneTimestamps(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((timestamp) => now - timestamp < windowMs);
}

function tryConsumeWindows(
  scope: string,
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

export function getLandingRelayClientIp(request: Request): string {
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

/**
 * Endpoint traffic limit (submit + persist). Throws when exceeded.
 * Does not consume LLM budget.
 */
export function assertLandingRelaySubmitRateLimit(ip: string): void {
  if (!isRateLimitEnabled()) {
    return;
  }

  const now = Date.now();
  const subject = ip.trim() || 'unknown';

  const globalResult = tryConsumeWindows('global', 'all', getGlobalLandingWindows(), now);
  if (!globalResult.allowed) {
    throw new LandingRelayRateLimitError(
      `Landing relay rate limit reached (${globalResult.limit} per ${globalResult.label}).`,
      globalResult.retryAfterMs,
    );
  }

  const ipResult = tryConsumeWindows('ip', subject, getIpWindows(), now);
  if (!ipResult.allowed) {
    throw new LandingRelayRateLimitError(
      `Landing relay rate limit reached (${ipResult.limit} per ${ipResult.label}).`,
      ipResult.retryAfterMs,
    );
  }
}

/**
 * Paid LLM completion budget. Returns false when over limit (caller uses free fallback).
 * Isolated from caption/booking LLM counters in llm-rate-limit.ts.
 */
export function tryConsumeLandingRelayLlmBudget(ip: string): boolean {
  if (!isRateLimitEnabled()) {
    return true;
  }

  const now = Date.now();
  const subject = ip.trim() || 'unknown';

  // Split IP vs global windows for clearer keys
  const ipWindows = getLlmWindows().filter((w) => !w.label.startsWith('global'));
  const globalWindows = getLlmWindows()
    .filter((w) => w.label.startsWith('global'))
    .map((w) => ({ ...w, label: w.label.replace(/^global-/, '') }));

  const ipResult = tryConsumeWindows('llm-ip', subject, ipWindows, now);
  if (!ipResult.allowed) {
    return false;
  }

  const globalResult = tryConsumeWindows('llm-global', 'all', globalWindows, now);
  return globalResult.allowed;
}

export function isLandingRelayRateLimitError(
  error: unknown,
): error is LandingRelayRateLimitError {
  return error instanceof LandingRelayRateLimitError;
}

/** Test helper — clear in-memory buckets between tests. */
export function __resetLandingRelayRateLimitForTests(): void {
  hitTimestamps.clear();
}
