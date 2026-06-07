import { describe, expect, it } from 'vitest';
import {
  mapTransactionToEarningRow,
  summarizeMentorEarnings,
} from '@/lib/mentor-earnings';
import type { MentorEarningRow } from '@/lib/mentor-earnings-types';

describe('summarizeMentorEarnings', () => {
  it('aggregates gross, fees, and payout buckets', () => {
    const rows: MentorEarningRow[] = [
      {
        id: '1',
        bookingId: 'b1',
        menteeName: 'Alex',
        scheduledAt: '2026-06-01T12:00:00Z',
        bookingStatus: 'confirmed',
        grossCents: 10000,
        platformFeeCents: 2000,
        mentorPayoutCents: 8000,
        status: 'pending',
        createdAt: '2026-06-01T10:00:00Z',
      },
      {
        id: '2',
        bookingId: 'b2',
        menteeName: 'Sam',
        scheduledAt: '2026-06-02T12:00:00Z',
        bookingStatus: 'completed',
        grossCents: 20000,
        platformFeeCents: 4000,
        mentorPayoutCents: 16000,
        status: 'completed',
        createdAt: '2026-06-02T10:00:00Z',
      },
    ];

    expect(summarizeMentorEarnings(rows)).toEqual({
      totalGrossCents: 30000,
      totalPlatformFeeCents: 6000,
      totalPayoutCents: 24000,
      pendingPayoutCents: 8000,
      completedPayoutCents: 16000,
      sessionCount: 2,
    });
  });
});

describe('mapTransactionToEarningRow', () => {
  it('maps joined booking and mentee name', () => {
    const row = mapTransactionToEarningRow({
      id: 'tx-1',
      booking_id: 'bk-1',
      gross_amount_cents: 32000,
      platform_fee_cents: 6400,
      mentor_payout_cents: 25600,
      status: 'completed',
      created_at: '2026-06-03T08:00:00Z',
      bookings: {
        scheduled_at: '2026-06-05T15:00:00Z',
        status: 'completed',
        users: { full_name: 'Carlos Hernandez' },
      },
    });

    expect(row).toMatchObject({
      menteeName: 'Carlos Hernandez',
      mentorPayoutCents: 25600,
      status: 'completed',
    });
  });

  it('returns null when booking join is missing', () => {
    expect(
      mapTransactionToEarningRow({
        id: 'tx-2',
        booking_id: 'bk-2',
        gross_amount_cents: 1000,
        platform_fee_cents: 200,
        mentor_payout_cents: 800,
        status: 'pending',
        created_at: '2026-06-03T08:00:00Z',
        bookings: null,
      }),
    ).toBeNull();
  });
});
