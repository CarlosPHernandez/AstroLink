import { describe, expect, it } from 'vitest';

import { resolveSessionGate } from '@/lib/booking-access';

describe('resolveSessionGate', () => {
  const roomUrl = 'https://astrolink.daily.co/astrolink-test';

  it('returns pending_payment for unpaid bookings', () => {
    expect(
      resolveSessionGate({
        status: 'pending_payment',
        dailyRoomUrl: null,
        scheduledAt: null,
      }),
    ).toBe('pending_payment');
  });

  it('returns provisioning when confirmed but no room', () => {
    expect(
      resolveSessionGate({
        status: 'confirmed',
        dailyRoomUrl: null,
        scheduledAt: new Date().toISOString(),
      }),
    ).toBe('provisioning');
  });

  it('returns too_early before join window', () => {
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(
      resolveSessionGate({
        status: 'confirmed',
        dailyRoomUrl: roomUrl,
        scheduledAt,
        nowMs: Date.now(),
      }),
    ).toBe('too_early');
  });

  it('returns ready at or after scheduled start (default before=0)', () => {
    const scheduledAt = new Date(Date.now() - 30 * 1000).toISOString();
    expect(
      resolveSessionGate({
        status: 'confirmed',
        dailyRoomUrl: roomUrl,
        scheduledAt,
        nowMs: Date.now(),
      }),
    ).toBe('ready');
  });

  it('returns too_early shortly before start when before window is 0', () => {
    const scheduledAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    expect(
      resolveSessionGate({
        status: 'confirmed',
        dailyRoomUrl: roomUrl,
        scheduledAt,
        nowMs: Date.now(),
      }),
    ).toBe('too_early');
  });

  it('returns expired after join window', () => {
    const scheduledAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(
      resolveSessionGate({
        status: 'confirmed',
        dailyRoomUrl: roomUrl,
        scheduledAt,
        nowMs: Date.now(),
      }),
    ).toBe('expired');
  });

  it('returns ready for unscheduled confirmed bookings with a room', () => {
    expect(
      resolveSessionGate({
        status: 'confirmed',
        dailyRoomUrl: roomUrl,
        scheduledAt: null,
      }),
    ).toBe('ready');
  });

  it('returns completed for finished sessions', () => {
    expect(
      resolveSessionGate({
        status: 'completed',
        dailyRoomUrl: roomUrl,
        scheduledAt: new Date().toISOString(),
      }),
    ).toBe('completed');
  });
});
