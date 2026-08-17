/**
 * Pure helpers for the in-call remaining-time countdown.
 *
 * End time matches join-window / Daily token window: scheduled start + booked
 * duration (fallback when duration is missing uses the join-window default).
 */

import { resolveJoinWindowEndMs } from '@/lib/join-window';

/** Warn when ≤5 minutes remain. */
export const SESSION_TIMER_WARNING_MS = 5 * 60_000;
/** Critical when ≤1 minute remains. */
export const SESSION_TIMER_CRITICAL_MS = 60_000;

export type SessionTimerUrgency = 'normal' | 'warning' | 'critical' | 'ended';

export type SessionTimerSnapshot = {
  endMs: number | null;
  remainingMs: number;
  display: string;
  urgency: SessionTimerUrgency;
  /** Accessible label, e.g. "12 minutes 30 seconds remaining". */
  ariaLabel: string;
};

/**
 * Absolute end of the booked session in ms since epoch.
 * Returns null when scheduledAt is missing/invalid (timer should hide).
 */
export function resolveSessionEndMs(
  scheduledAt: string | null | undefined,
  durationMinutes?: number | null,
): number | null {
  if (!scheduledAt?.trim()) {
    return null;
  }
  const scheduledMs = new Date(scheduledAt).getTime();
  if (Number.isNaN(scheduledMs)) {
    return null;
  }
  return resolveJoinWindowEndMs(scheduledMs, durationMinutes);
}

export function remainingSessionMs(endMs: number, nowMs: number = Date.now()): number {
  return Math.max(0, endMs - nowMs);
}

/** Clock format: M:SS under 1h, H:MM:SS at/above 1h. Always whole seconds. */
export function formatRemainingClock(remainingMs: number): string {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const mm = String(minutes).padStart(hours > 0 ? 2 : 1, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  // Always show at least m:ss with zero-padded minutes for scanability (e.g. 05:09).
  return `${String(minutes).padStart(2, '0')}:${ss}`;
}

export function sessionTimerUrgency(remainingMs: number): SessionTimerUrgency {
  if (remainingMs <= 0) {
    return 'ended';
  }
  if (remainingMs <= SESSION_TIMER_CRITICAL_MS) {
    return 'critical';
  }
  if (remainingMs <= SESSION_TIMER_WARNING_MS) {
    return 'warning';
  }
  return 'normal';
}

function formatAriaDuration(remainingMs: number): string {
  if (remainingMs <= 0) {
    return 'Session time is up';
  }
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  }
  if (minutes > 0 || hours > 0) {
    parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
  }
  parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`);
  return `${parts.join(' ')} remaining`;
}

export function getSessionTimerSnapshot(
  scheduledAt: string | null | undefined,
  durationMinutes?: number | null,
  nowMs: number = Date.now(),
): SessionTimerSnapshot | null {
  const endMs = resolveSessionEndMs(scheduledAt, durationMinutes);
  if (endMs == null) {
    return null;
  }
  const remainingMs = remainingSessionMs(endMs, nowMs);
  const urgency = sessionTimerUrgency(remainingMs);
  return {
    endMs,
    remainingMs,
    display: formatRemainingClock(remainingMs),
    urgency,
    ariaLabel:
      urgency === 'ended'
        ? 'Session time is up'
        : formatAriaDuration(remainingMs),
  };
}
