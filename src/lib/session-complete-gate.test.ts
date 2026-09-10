import { describe, expect, it } from 'vitest';
import {
  SESSION_COMPLETE_EARLY_GRACE_MS,
  sessionCompleteTooEarly,
} from '@/lib/session-complete-gate';

describe('sessionCompleteTooEarly', () => {
  const nowMs = Date.parse('2030-01-15T18:00:00.000Z');

  it('allows already-completed bookings (idempotent replay)', () => {
    expect(
      sessionCompleteTooEarly({
        status: 'completed',
        scheduledAt: '2030-06-01T00:00:00.000Z',
        nowMs,
      }),
    ).toEqual({ blocked: false });
  });

  it('allows admin to complete before start', () => {
    expect(
      sessionCompleteTooEarly({
        status: 'confirmed',
        scheduledAt: '2030-06-01T00:00:00.000Z',
        sessionRole: 'admin',
        nowMs,
      }),
    ).toEqual({ blocked: false });
  });

  it('blocks confirmed bookings more than the grace window before start', () => {
    const scheduledAt = new Date(nowMs + SESSION_COMPLETE_EARLY_GRACE_MS + 60_000).toISOString();
    expect(
      sessionCompleteTooEarly({
        status: 'confirmed',
        scheduledAt,
        sessionRole: 'mentee',
        nowMs,
      }),
    ).toEqual({ blocked: true, error: 'Session has not started yet.' });
  });

  it('allows complete within the early grace window', () => {
    const scheduledAt = new Date(nowMs + SESSION_COMPLETE_EARLY_GRACE_MS - 1_000).toISOString();
    expect(
      sessionCompleteTooEarly({
        status: 'confirmed',
        scheduledAt,
        nowMs,
      }),
    ).toEqual({ blocked: false });
  });

  it('blocks confirmed bookings with no scheduled_at', () => {
    expect(
      sessionCompleteTooEarly({
        status: 'confirmed',
        scheduledAt: null,
        nowMs,
      }),
    ).toEqual({ blocked: true, error: 'Session has not started yet.' });
  });

  it('blocks confirmed bookings with an invalid scheduled_at', () => {
    expect(
      sessionCompleteTooEarly({
        status: 'confirmed',
        scheduledAt: 'not-a-date',
        nowMs,
      }),
    ).toEqual({ blocked: true, error: 'Session has not started yet.' });
  });
});
