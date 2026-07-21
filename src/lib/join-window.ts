/**
 * Pure timing helpers for "Join room" button enablement.
 *
 * - Server gate still enforces access (booking-access + Daily nbf/exp).
 * - Join opens at scheduled start (default before=0).
 * - Join stays open until the booked call ends (duration_minutes), so late
 *   arrivals (e.g. 5+ minutes late) can still join until the session is over.
 * - If duration is missing, falls back to DAILY_ROOM_JOIN_WINDOW_AFTER_MINUTES (60).
 */

function parseNonNegativeInt(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** 0 = Join enabled at scheduled start (not early). */
export const DEFAULT_JOIN_BEFORE_MINUTES = 0;
/** Used only when booking has no duration_minutes. */
export const DEFAULT_JOIN_AFTER_MINUTES = 60;

export function getJoinBeforeMinutes(): number {
  if (typeof process !== 'undefined' && process.env) {
    return parseNonNegativeInt(
      process.env.DAILY_ROOM_JOIN_WINDOW_BEFORE_MINUTES,
      DEFAULT_JOIN_BEFORE_MINUTES,
    );
  }
  return DEFAULT_JOIN_BEFORE_MINUTES;
}

export function getJoinAfterMinutesFallback(): number {
  if (typeof process !== 'undefined' && process.env) {
    return parsePositiveInt(
      process.env.DAILY_ROOM_JOIN_WINDOW_AFTER_MINUTES,
      DEFAULT_JOIN_AFTER_MINUTES,
    );
  }
  return DEFAULT_JOIN_AFTER_MINUTES;
}

/**
 * End of join / "still upcoming" window in ms since epoch.
 * Prefer booked duration so late joiners can enter until the call is done.
 */
export function resolveJoinWindowEndMs(
  scheduledMs: number,
  durationMinutes?: number | null,
): number {
  if (durationMinutes != null && Number.isFinite(durationMinutes) && durationMinutes > 0) {
    return scheduledMs + durationMinutes * 60_000;
  }
  return scheduledMs + getJoinAfterMinutesFallback() * 60_000;
}

/** Tooltip / helper copy for dashboard Join buttons. */
export function joinRoomAvailabilityTitle(beforeMinutes: number = DEFAULT_JOIN_BEFORE_MINUTES): string {
  if (beforeMinutes <= 0) {
    return 'Join room becomes available at the session start time and stays open until the call ends';
  }
  return `Join room becomes available ${beforeMinutes} minutes before the session and stays open until the call ends`;
}

export type JoinPhase = 'too_early' | 'ready' | 'expired' | 'unscheduled';

export function getJoinPhase(
  scheduledAt: string | null | undefined,
  nowMs: number = Date.now(),
  durationMinutes?: number | null,
): JoinPhase {
  if (!scheduledAt?.trim()) {
    return 'unscheduled';
  }
  const scheduledMs = new Date(scheduledAt).getTime();
  if (Number.isNaN(scheduledMs)) {
    return 'unscheduled';
  }

  const beforeMin = getJoinBeforeMinutes();
  const windowStart = scheduledMs - beforeMin * 60_000;
  const windowEnd = resolveJoinWindowEndMs(scheduledMs, durationMinutes);

  if (nowMs < windowStart) return 'too_early';
  if (nowMs > windowEnd) return 'expired';
  return 'ready';
}

/**
 * Whether Join should be *enabled* (clickable).
 *
 * - completed: enabled when a room exists (recap path).
 * - confirmed: enabled inside the join window; room may be provisioned on navigate.
 * - other statuses: false.
 */
export function isJoinRoomEnabled(
  status: string,
  dailyRoomUrl: string | null | undefined,
  scheduledAt: string | null | undefined,
  nowMs: number = Date.now(),
  durationMinutes?: number | null,
): boolean {
  if (status === 'completed') {
    return Boolean(dailyRoomUrl);
  }
  if (status !== 'confirmed') {
    return false;
  }
  return getJoinPhase(scheduledAt, nowMs, durationMinutes) === 'ready';
}

/** Whether to show a Join control at all (enabled or disabled until window opens). */
export function canShowJoinControl(status: string): boolean {
  return status === 'confirmed' || status === 'completed';
}
