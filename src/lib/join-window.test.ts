import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import {
  isJoinRoomEnabled,
  getJoinPhase,
  DEFAULT_JOIN_BEFORE_MINUTES,
  joinRoomAvailabilityTitle,
  resolveJoinWindowEndMs,
  canShowJoinControl,
} from './join-window';

describe('join-window', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.DAILY_ROOM_JOIN_WINDOW_BEFORE_MINUTES;
    delete process.env.DAILY_ROOM_JOIN_WINDOW_AFTER_MINUTES;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('resolveJoinWindowEndMs', () => {
    it('uses booked duration when present', () => {
      const start = Date.parse('2026-07-21T15:00:00.000Z');
      expect(resolveJoinWindowEndMs(start, 15)).toBe(start + 15 * 60_000);
      expect(resolveJoinWindowEndMs(start, 45)).toBe(start + 45 * 60_000);
    });

    it('falls back to 60 minutes when duration missing', () => {
      const start = Date.parse('2026-07-21T15:00:00.000Z');
      expect(resolveJoinWindowEndMs(start, null)).toBe(start + 60 * 60_000);
      expect(resolveJoinWindowEndMs(start, undefined)).toBe(start + 60 * 60_000);
    });
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
      expect(getJoinPhase(scheduledAt, Date.now(), 30)).toBe('ready');
    });

    it('returns ready when 5 minutes late on a 45-min call', () => {
      const scheduledAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(getJoinPhase(scheduledAt, Date.now(), 45)).toBe('ready');
    });

    it('returns expired after booked duration ends', () => {
      const scheduledAt = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      expect(getJoinPhase(scheduledAt, Date.now(), 15)).toBe('expired');
    });

    it('returns expired after default after-window when no duration', () => {
      const scheduledAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(getJoinPhase(scheduledAt, Date.now())).toBe('expired');
    });
  });

  describe('isJoinRoomEnabled', () => {
    const roomUrl = 'https://astrolink.daily.co/room-123';

    it('returns false for pending_payment even with room', () => {
      const scheduledAt = new Date(Date.now() - 30 * 1000).toISOString();
      expect(isJoinRoomEnabled('pending_payment', roomUrl, scheduledAt)).toBe(false);
    });

    it('returns true for completed when room exists', () => {
      const farFuture = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      expect(isJoinRoomEnabled('completed', roomUrl, farFuture)).toBe(true);
    });

    it('returns false for completed without room', () => {
      expect(isJoinRoomEnabled('completed', null, new Date().toISOString())).toBe(false);
    });

    it('returns false for confirmed far in future (before start)', () => {
      const farFuture = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      expect(isJoinRoomEnabled('confirmed', roomUrl, farFuture)).toBe(false);
    });

    it('returns true for confirmed after start even without room (provision on navigate)', () => {
      const started = new Date(Date.now() - 30 * 1000).toISOString();
      expect(isJoinRoomEnabled('confirmed', null, started, Date.now(), 30)).toBe(true);
    });

    it('returns false for confirmed after call duration', () => {
      const past = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      expect(isJoinRoomEnabled('confirmed', roomUrl, past, Date.now(), 15)).toBe(false);
    });

    it('defaults join before window to session start', () => {
      expect(DEFAULT_JOIN_BEFORE_MINUTES).toBe(0);
      expect(joinRoomAvailabilityTitle()).toMatch(/session start time/i);
    });
  });

  describe('canShowJoinControl', () => {
    it('shows for confirmed and completed only', () => {
      expect(canShowJoinControl('confirmed')).toBe(true);
      expect(canShowJoinControl('completed')).toBe(true);
      expect(canShowJoinControl('pending_payment')).toBe(false);
    });
  });
});
