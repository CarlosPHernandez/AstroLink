/**
 * Pure timing helpers for "Join room" button enablement.
 *
 * - The real room access control is always enforced server-side in
 *   getBookingForSession / resolveSessionGate / Daily token nbf (see booking-access.ts and daily.ts).
 *   Early navigation or direct access is blocked by the gate regardless of this UI state.
 * - This module powers the *UI affordance*: the button is visible ("shows up") for confirmed
 *   bookings that have a room, but appears disabled until inside the window.
 * - Defaults to 15 minutes before (matching the default DAILY_ROOM_JOIN_WINDOW_BEFORE_MINUTES
 *   and common heads-up patterns like Google Meet calendars).
 * - getJoinBeforeMinutes() reads the real env on the server (when process.env available).
 *   Client usage falls back to the 15 min default so the module remains importable in 'use client' components.
 * - Live activation on an open dashboard is handled by a small interval in the consuming client.
 */

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const DEFAULT_JOIN_BEFORE_MINUTES = 15;
export const DEFAULT_JOIN_AFTER_MINUTES = 60;

export function getJoinBeforeMinutes(): number {
  // On the server this can read the real env (used by Daily room/token logic too).
  // On the client, non-NEXT_PUBLIC envs are not present, so we fall back to default.
  if (typeof process !== 'undefined' && process.env) {
    return parsePositiveInt(
      process.env.DAILY_ROOM_JOIN_WINDOW_BEFORE_MINUTES,
      DEFAULT_JOIN_BEFORE_MINUTES
    );
  }
  return DEFAULT_JOIN_BEFORE_MINUTES;
}

export type JoinPhase = 'too_early' | 'ready' | 'expired' | 'unscheduled';

export function getJoinPhase(
  scheduledAt: string | null | undefined,
  nowMs: number = Date.now()
): JoinPhase {
  if (!scheduledAt?.trim()) {
    return 'unscheduled';
  }
  const scheduledMs = new Date(scheduledAt).getTime();
  if (Number.isNaN(scheduledMs)) {
    return 'unscheduled';
  }

  const beforeMin = getJoinBeforeMinutes();
  const afterMin = parsePositiveInt(
    typeof process !== 'undefined' && process.env
      ? process.env.DAILY_ROOM_JOIN_WINDOW_AFTER_MINUTES
      : undefined,
    DEFAULT_JOIN_AFTER_MINUTES
  );

  const windowStart = scheduledMs - beforeMin * 60_000;
  const windowEnd = scheduledMs + afterMin * 60_000;

  if (nowMs < windowStart) return 'too_early';
  if (nowMs > windowEnd) return 'expired';
  return 'ready';
}

/**
 * Returns true when the "Join room" / "Join video room" control should be *enabled*
 * (clickable and styled active).
 *
 * Rules:
 * - Must have a dailyRoomUrl.
 * - 'completed' → always enabled (used for recap access).
 * - 'confirmed' → enabled only inside the join window.
 * - Other statuses → false.
 */
export function isJoinRoomEnabled(
  status: string,
  dailyRoomUrl: string | null | undefined,
  scheduledAt: string | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!dailyRoomUrl) {
    return false;
  }
  if (status === 'completed') {
    return true;
  }
  if (status !== 'confirmed') {
    return false;
  }
  return getJoinPhase(scheduledAt, nowMs) === 'ready';
}
