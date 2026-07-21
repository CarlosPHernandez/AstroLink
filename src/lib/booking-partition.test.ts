import { describe, expect, it } from 'vitest';

import { isBookingUpcoming, partitionMenteeBookings } from '@/lib/booking-partition';
import type { MenteeBookingView } from '@/lib/booking-partition';

function booking(
  overrides: Partial<MenteeBookingView> & Pick<MenteeBookingView, 'id' | 'scheduledAt'>,
): MenteeBookingView {
  return {
    mentorName: 'Expert',
    serviceType: 'session_1on1',
    status: 'confirmed',
    matchReason: null,
    dailyRoomUrl: 'https://astrolink.daily.co/r',
    briefing: null,
    durationMinutes: 45,
    ...overrides,
  };
}

describe('isBookingUpcoming', () => {
  it('keeps confirmed sessions upcoming until duration ends', () => {
    const now = new Date('2026-07-21T15:25:00.000Z'); // 5 min after 15:20 start
    const b = booking({
      id: 'a',
      scheduledAt: '2026-07-21T15:20:00.000Z',
      durationMinutes: 15,
    });
    expect(isBookingUpcoming(b, now)).toBe(true);
  });

  it('marks confirmed past after duration ends', () => {
    const now = new Date('2026-07-21T15:40:00.000Z');
    const b = booking({
      id: 'a',
      scheduledAt: '2026-07-21T15:20:00.000Z',
      durationMinutes: 15,
    });
    expect(isBookingUpcoming(b, now)).toBe(false);
  });

  it('always treats pending_payment as upcoming', () => {
    const now = new Date('2026-07-21T20:00:00.000Z');
    const b = booking({
      id: 'a',
      scheduledAt: '2026-07-01T15:20:00.000Z',
      status: 'pending_payment',
    });
    expect(isBookingUpcoming(b, now)).toBe(true);
  });
});

describe('partitionMenteeBookings', () => {
  it('puts in-progress call in upcoming so Join stays visible', () => {
    const now = new Date('2026-07-21T15:25:00.000Z');
    const result = partitionMenteeBookings(
      [
        booking({
          id: 'live',
          scheduledAt: '2026-07-21T15:20:00.000Z',
          durationMinutes: 15,
        }),
        booking({
          id: 'old',
          scheduledAt: '2026-07-20T15:20:00.000Z',
          durationMinutes: 15,
        }),
      ],
      now,
    );
    expect(result.upcoming.map((b) => b.id)).toEqual(['live']);
    expect(result.past.map((b) => b.id)).toEqual(['old']);
    expect(result.nextUpcoming?.id).toBe('live');
  });
});
