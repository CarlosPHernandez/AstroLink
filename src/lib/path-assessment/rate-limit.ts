import 'server-only';

/**
 * IP + email rate limits for Space Path Assessment submit.
 * Mirrors landing relay in-memory windows (isolated keys).
 */

export class PathAssessmentRateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = 'PathAssessmentRateLimitError';
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
  const flag = process.env.PATH_ASSESSMENT_RATE_LIMIT_ENABLED?.trim().toLowerCase();
  if (flag === 'false' || flag === '0') {
    return false;
  }
  return true;
}

function getIpWindows(): RateLimitWindow[] {
  return [
    {
      label: 'minute',
      limit: parsePositiveInt(process.env.PATH_ASSESSMENT_MAX_PER_IP_MINUTE, 2),
      windowMs: 60_000,
    },
    {
      label: 'hour',
      limit: parsePositiveInt(process.env.PATH_ASSESSMENT_MAX_PER_IP_HOUR, 6),
      windowMs: 60 * 60_000,
    },
    {
      label: 'day',
      limit: parsePositiveInt(process.env.PATH_ASSESSMENT_MAX_PER_IP_DAY, 12),
      windowMs: 24 * 60 * 60_000,
    },
  ];
}

function getEmailWindows(): RateLimitWindow[] {
  return [
    {
      label: 'hour',
      limit: parsePositiveInt(process.env.PATH_ASSESSMENT_MAX_PER_EMAIL_HOUR, 3),
      windowMs: 60 * 60_000,
    },
    {
      label: 'day',
      limit: parsePositiveInt(process.env.PATH_ASSESSMENT_MAX_PER_EMAIL_DAY, 5),
      windowMs: 24 * 60 * 60_000,
    },
  ];
}

function getGlobalWindows(): RateLimitWindow[] {
  return [
    {
      label: 'minute',
      limit: parsePositiveInt(process.env.PATH_ASSESSMENT_MAX_GLOBAL_MINUTE, 20),
      windowMs: 60_000,
    },
    {
      label: 'hour',
      limit: parsePositiveInt(process.env.PATH_ASSESSMENT_MAX_GLOBAL_HOUR, 120),
      windowMs: 60 * 60_000,
    },
  ];
}

const hitTimestamps = new Map<string, number[]>();

function bucketKey(scope: string, windowLabel: string, subjectKey: string): string {
  return `path-assessment:${scope}:${windowLabel}:${subjectKey}`;
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

export function getPathAssessmentClientIp(request: Request): string {
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
 * Submit rate limit (IP + email + global). Throws when exceeded.
 */
export function assertPathAssessmentSubmitRateLimit(ip: string, email: string): void {
  if (!isRateLimitEnabled()) {
    return;
  }

  const now = Date.now();
  const subjectIp = ip.trim() || 'unknown';
  const subjectEmail = email.trim().toLowerCase() || 'unknown';

  const globalResult = tryConsumeWindows('global', 'all', getGlobalWindows(), now);
  if (!globalResult.allowed) {
    throw new PathAssessmentRateLimitError(
      `Assessment rate limit reached (${globalResult.limit} per ${globalResult.label}). Try again shortly.`,
      globalResult.retryAfterMs,
    );
  }

  const ipResult = tryConsumeWindows('ip', subjectIp, getIpWindows(), now);
  if (!ipResult.allowed) {
    throw new PathAssessmentRateLimitError(
      `Assessment rate limit reached (${ipResult.limit} per ${ipResult.label}). Try again shortly.`,
      ipResult.retryAfterMs,
    );
  }

  const emailResult = tryConsumeWindows('email', subjectEmail, getEmailWindows(), now);
  if (!emailResult.allowed) {
    throw new PathAssessmentRateLimitError(
      `This email has reached the assessment limit (${emailResult.limit} per ${emailResult.label}). Try again later.`,
      emailResult.retryAfterMs,
    );
  }
}

export function isPathAssessmentRateLimitError(
  error: unknown,
): error is PathAssessmentRateLimitError {
  return error instanceof PathAssessmentRateLimitError;
}

/** Test helper — clear in-memory buckets between tests. */
export function __resetPathAssessmentRateLimitForTests(): void {
  hitTimestamps.clear();
}
