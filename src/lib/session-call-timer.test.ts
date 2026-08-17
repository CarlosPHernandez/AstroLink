import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  formatRemainingClock,
  getSessionTimerSnapshot,
  remainingSessionMs,
  resolveSessionEndMs,
  sessionTimerUrgency,
  SESSION_TIMER_CRITICAL_MS,
  SESSION_TIMER_WARNING_MS,
} from './session-call-timer';

describe('session-call-timer', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.DAILY_ROOM_JOIN_WINDOW_AFTER_MINUTES;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.useRealTimers();
  });

  describe('resolveSessionEndMs', () => {
    it('returns scheduled start + booked duration', () => {
      const scheduledAt = '2026-07-21T15:00:00.000Z';
      const start = Date.parse(scheduledAt);
      expect(resolveSessionEndMs(scheduledAt, 15)).toBe(start + 15 * 60_000);
      expect(resolveSessionEndMs(scheduledAt, 45)).toBe(start + 45 * 60_000);
    });

    it('falls back when duration missing', () => {
      const scheduledAt = '2026-07-21T15:00:00.000Z';
      const start = Date.parse(scheduledAt);
      expect(resolveSessionEndMs(scheduledAt, null)).toBe(start + 60 * 60_000);
    });

    it('returns null for missing or invalid schedule', () => {
      expect(resolveSessionEndMs(null, 30)).toBeNull();
      expect(resolveSessionEndMs('', 30)).toBeNull();
      expect(resolveSessionEndMs('not-a-date', 30)).toBeNull();
    });
  });

  describe('remainingSessionMs', () => {
    it('clamps at zero after end', () => {
      expect(remainingSessionMs(1_000, 2_000)).toBe(0);
      expect(remainingSessionMs(5_000, 2_000)).toBe(3_000);
    });
  });

  describe('formatRemainingClock', () => {
    it('formats under one hour as MM:SS', () => {
      expect(formatRemainingClock(0)).toBe('00:00');
      expect(formatRemainingClock(1_000)).toBe('00:01');
      expect(formatRemainingClock(65_000)).toBe('01:05');
      expect(formatRemainingClock(14 * 60_000 + 9_000)).toBe('14:09');
      expect(formatRemainingClock(59 * 60_000 + 59_000)).toBe('59:59');
    });

    it('formats one hour and above as H:MM:SS', () => {
      expect(formatRemainingClock(60 * 60_000)).toBe('1:00:00');
      expect(formatRemainingClock(60 * 60_000 + 5_000)).toBe('1:00:05');
      expect(formatRemainingClock(90 * 60_000 + 7_000)).toBe('1:30:07');
    });

    it('ceils partial seconds so the last second is visible', () => {
      expect(formatRemainingClock(1)).toBe('00:01');
      expect(formatRemainingClock(1_001)).toBe('00:02');
    });
  });

  describe('sessionTimerUrgency', () => {
    it('maps thresholds', () => {
      expect(sessionTimerUrgency(SESSION_TIMER_WARNING_MS + 1)).toBe('normal');
      expect(sessionTimerUrgency(SESSION_TIMER_WARNING_MS)).toBe('warning');
      expect(sessionTimerUrgency(SESSION_TIMER_CRITICAL_MS + 1)).toBe('warning');
      expect(sessionTimerUrgency(SESSION_TIMER_CRITICAL_MS)).toBe('critical');
      expect(sessionTimerUrgency(0)).toBe('ended');
    });
  });

  describe('getSessionTimerSnapshot', () => {
    it('returns null without a valid schedule', () => {
      expect(getSessionTimerSnapshot(null, 30)).toBeNull();
    });

    it('builds a mid-session snapshot', () => {
      const scheduledAt = '2026-07-21T15:00:00.000Z';
      const nowMs = Date.parse(scheduledAt) + 10 * 60_000; // 10 min in on 30-min call
      const snap = getSessionTimerSnapshot(scheduledAt, 30, nowMs);
      expect(snap).not.toBeNull();
      expect(snap!.remainingMs).toBe(20 * 60_000);
      expect(snap!.display).toBe('20:00');
      expect(snap!.urgency).toBe('normal');
      expect(snap!.ariaLabel).toMatch(/20 minutes/i);
      expect(snap!.ariaLabel).toMatch(/remaining/i);
    });

    it('marks warning and critical near the end', () => {
      const scheduledAt = '2026-07-21T15:00:00.000Z';
      const end = Date.parse(scheduledAt) + 30 * 60_000;

      const warn = getSessionTimerSnapshot(scheduledAt, 30, end - 4 * 60_000);
      expect(warn!.urgency).toBe('warning');
      expect(warn!.display).toBe('04:00');

      const crit = getSessionTimerSnapshot(scheduledAt, 30, end - 45_000);
      expect(crit!.urgency).toBe('critical');
      expect(crit!.display).toBe('00:45');
    });

    it('shows ended state after scheduled end', () => {
      const scheduledAt = '2026-07-21T15:00:00.000Z';
      const end = Date.parse(scheduledAt) + 15 * 60_000;
      const snap = getSessionTimerSnapshot(scheduledAt, 15, end + 5_000);
      expect(snap!.urgency).toBe('ended');
      expect(snap!.display).toBe('00:00');
      expect(snap!.remainingMs).toBe(0);
      expect(snap!.ariaLabel).toMatch(/time is up/i);
    });

    it('accounts for late join (remaining is wall-clock to scheduled end)', () => {
      // Joined 5 min late on a 15-min booking → 10 min left
      const scheduledAt = '2026-07-21T15:00:00.000Z';
      const nowMs = Date.parse(scheduledAt) + 5 * 60_000;
      const snap = getSessionTimerSnapshot(scheduledAt, 15, nowMs);
      expect(snap!.display).toBe('10:00');
      expect(snap!.remainingMs).toBe(10 * 60_000);
    });
  });
});
