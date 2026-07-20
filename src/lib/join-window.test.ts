import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import {
  isJoinRoomEnabled,
  getJoinPhase,
  DEFAULT_JOIN_BEFORE_MINUTES,
  joinRoomAvailabilityTitle,
} from './join-window';

describe('join-window', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Ensure clean env for tests; join-window falls back to defaults
    delete process.env.DAILY_ROOM_JOIN_WINDOW_BEFORE_MINUTES;
    delete process.env.DAILY_ROOM_JOIN_WINDOW_AFTER_MINUTES;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('getJoinPhase', () => {
    it('returns unscheduled when no schedule', () => {
      expect(getJoinPhase(null, Date.now())).toBe('unscheduled');
    });

    it('returns too_early before scheduled start (default before=0)', () => {
      const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      expect(getJoinPhase(scheduledAt, Date.now())).toBe('too_early');
    });

    it('returns ready at or after scheduled start', () => {
      const scheduledAt = new Date(Date.now() - 30 * 1000).toISOString();
      expect(getJoinPhase(scheduledAt, Date.now())).toBe('ready');
    });

    it('returns expired after join window', () => {
      const scheduledAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(getJoinPhase(scheduledAt, Date.now())).toBe('expired');
    });
  });

  describe('isJoinRoomEnabled', () => {
    const roomUrl = 'https://astrolink.daily.co/room-123';

    it('returns false with no dailyRoomUrl', () => {
      const scheduledAt = new Date(Date.now() - 30 * 1000).toISOString();
      expect(isJoinRoomEnabled('confirmed', null, scheduledAt)).toBe(false);
    });

    it('returns false for pending_payment even with room', () => {
      const scheduledAt = new Date(Date.now() - 30 * 1000).toISOString();
      expect(isJoinRoomEnabled('pending_payment', roomUrl, scheduledAt)).toBe(false);
    });

    it('returns true for completed (recap access) regardless of time', () => {
      const farFuture = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      expect(isJoinRoomEnabled('completed', roomUrl, farFuture)).toBe(true);

      const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(isJoinRoomEnabled('completed', roomUrl, past)).toBe(true);
    });

    it('returns false for confirmed far in future (before start)', () => {
      const farFuture = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      expect(isJoinRoomEnabled('confirmed', roomUrl, farFuture)).toBe(false);
    });

    it('returns true for confirmed at or after start', () => {
      const started = new Date(Date.now() - 30 * 1000).toISOString();
      expect(isJoinRoomEnabled('confirmed', roomUrl, started)).toBe(true);
    });

    it('returns false for confirmed after window (expired)', () => {
      const past = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(isJoinRoomEnabled('confirmed', roomUrl, past)).toBe(false);
    });

    it('defaults join before window to session start', () => {
      expect(DEFAULT_JOIN_BEFORE_MINUTES).toBe(0);
      expect(joinRoomAvailabilityTitle()).toBe(
        'Join room becomes available at the session start time',
      );
    });
  });
});
