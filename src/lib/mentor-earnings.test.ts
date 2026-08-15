import { describe, expect, it } from 'vitest';
import {
  mapTransactionToEarningRow,
  resolveTransferStatus,
  summarizeMentorEarnings,
} from '@/lib/mentor-earnings';
import type { MentorEarningRow } from '@/lib/mentor-earnings-types';

function earningRow(
  overrides: Partial<MentorEarningRow> & Pick<MentorEarningRow, 'id' | 'status' | 'mentorPayoutCents'>,
): MentorEarningRow {
  return {
    bookingId: 'b1',
    menteeName: 'Alex',
    scheduledAt: '2026-06-01T12:00:00Z',
    bookingStatus: 'completed',
    grossCents: 10000,
    platformFeeCents: 2000,
    transferStatus: 'not_applicable',
    createdAt: '2026-06-01T10:00:00Z',
    ...overrides,
  };
}

describe('resolveTransferStatus', () => {
  it('marks completed rows as awaiting or transferred', () => {
    expect(resolveTransferStatus('completed', false)).toBe('awaiting');
    expect(resolveTransferStatus('completed', true)).toBe('transferred');
    expect(resolveTransferStatus('refunded', true)).toBe('not_applicable');
  });
});

describe('summarizeMentorEarnings', () => {
  it('aggregates recorded share and awaiting transfer from completed rows', () => {
    const rows: MentorEarningRow[] = [
      earningRow({
        id: '1',
        status: 'pending',
        mentorPayoutCents: 8000,
        transferStatus: 'not_applicable',
      }),
      earningRow({
        id: '2',
        status: 'completed',
        mentorPayoutCents: 16000,
        grossCents: 20000,
        platformFeeCents: 4000,
        transferStatus: 'awaiting',
      }),
    ];

    expect(summarizeMentorEarnings(rows)).toEqual({
      totalGrossCents: 20000,
      totalPlatformFeeCents: 4000,
      recordedShareCents: 16000,
      awaitingTransferCents: 16000,
      transferredCents: 0,
      refundedPayoutCents: 0,
      sessionCount: 1,
    });
  });

  it('splits awaiting and transferred buckets for completed rows', () => {
    const rows: MentorEarningRow[] = [
      earningRow({
        id: '1',
        status: 'completed',
        mentorPayoutCents: 8000,
        transferStatus: 'transferred',
      }),
      earningRow({
        id: '2',
        status: 'completed',
        mentorPayoutCents: 12000,
        transferStatus: 'awaiting',
      }),
    ];

    expect(summarizeMentorEarnings(rows)).toEqual({
      totalGrossCents: 20000,
      totalPlatformFeeCents: 4000,
      recordedShareCents: 20000,
      awaitingTransferCents: 12000,
      transferredCents: 8000,
      refundedPayoutCents: 0,
      sessionCount: 2,
    });
  });

  it('excludes refunded and failed rows from recorded totals', () => {
    const rows: MentorEarningRow[] = [
      earningRow({
        id: '1',
        status: 'completed',
        mentorPayoutCents: 8000,
        transferStatus: 'awaiting',
      }),
      earningRow({
        id: '2',
        status: 'refunded',
        mentorPayoutCents: 16000,
        grossCents: 20000,
        platformFeeCents: 4000,
        transferStatus: 'not_applicable',
      }),
      earningRow({
        id: '3',
        status: 'failed',
        mentorPayoutCents: 4000,
        grossCents: 5000,
        platformFeeCents: 1000,
        transferStatus: 'not_applicable',
      }),
    ];

    expect(summarizeMentorEarnings(rows)).toEqual({
      totalGrossCents: 10000,
      totalPlatformFeeCents: 2000,
      recordedShareCents: 8000,
      awaitingTransferCents: 8000,
      transferredCents: 0,
      refundedPayoutCents: 16000,
      sessionCount: 1,
    });
  });
});

describe('mapTransactionToEarningRow', () => {
  it('maps joined booking and transfer status', () => {
    const row = mapTransactionToEarningRow(
      {
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
          payout_eligible: null,
          users: { full_name: 'Carlos Hernandez' },
        },
      },
      new Set(['tx-1']),
    );

    expect(row).toMatchObject({
      menteeName: 'Carlos Hernandez',
      mentorPayoutCents: 25600,
      status: 'completed',
      transferStatus: 'transferred',
    });
  });

  it('does not mark a settled ineligible session as awaiting payout', () => {
    const row = mapTransactionToEarningRow(
      {
        id: 'tx-hold',
        booking_id: 'bk-hold',
        gross_amount_cents: 14400,
        platform_fee_cents: 2880,
        mentor_payout_cents: 11520,
        status: 'completed',
        created_at: '2026-08-15T08:00:00Z',
        bookings: {
          scheduled_at: '2026-08-15T15:00:00Z',
          status: 'completed',
          payout_eligible: false,
          users: { full_name: 'Buyer' },
        },
      },
      new Set(),
    );
    expect(row?.transferStatus).toBe('not_applicable');
  });

  it('returns null when booking join is missing', () => {
    expect(
      mapTransactionToEarningRow(
        {
          id: 'tx-2',
          booking_id: 'bk-2',
          gross_amount_cents: 1000,
          platform_fee_cents: 200,
          mentor_payout_cents: 800,
          status: 'pending',
          created_at: '2026-06-03T08:00:00Z',
          bookings: null,
        },
        new Set(),
      ),
    ).toBeNull();
  });
});