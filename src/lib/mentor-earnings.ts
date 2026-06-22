import 'server-only';

import { listPaidTransactionIdsForMentor } from '@/lib/mentor-manual-payouts';
import {
  type MentorEarningRow,
  type MentorEarningStatus,
  type MentorEarningsSummary,
  type MentorTransferStatus,
} from '@/lib/mentor-earnings-types';
import { supabaseAdmin } from '@/lib/supabase';
import type { BookingStatus } from '@/lib/types';

export type {
  MentorEarningRow,
  MentorEarningsSummary,
  MentorEarningStatus,
  MentorTransferStatus,
} from '@/lib/mentor-earnings-types';

type TransactionRow = {
  id: string;
  booking_id: string;
  gross_amount_cents: number;
  platform_fee_cents: number;
  mentor_payout_cents: number;
  status: MentorEarningStatus;
  created_at: string;
  bookings: {
    scheduled_at: string;
    status: BookingStatus;
    users: { full_name: string } | null;
  } | null;
};

export function resolveTransferStatus(
  status: MentorEarningStatus,
  isTransferred: boolean,
): MentorTransferStatus {
  if (status !== 'completed') {
    return 'not_applicable';
  }
  return isTransferred ? 'transferred' : 'awaiting';
}

export function summarizeMentorEarnings(rows: MentorEarningRow[]): MentorEarningsSummary {
  return rows.reduce<MentorEarningsSummary>(
    (acc, row) => {
      if (row.status === 'completed') {
        acc.totalGrossCents += row.grossCents;
        acc.totalPlatformFeeCents += row.platformFeeCents;
        acc.recordedShareCents += row.mentorPayoutCents;
        acc.sessionCount += 1;
        if (row.transferStatus === 'transferred') {
          acc.transferredCents += row.mentorPayoutCents;
        } else if (row.transferStatus === 'awaiting') {
          acc.awaitingTransferCents += row.mentorPayoutCents;
        }
      } else if (row.status === 'refunded') {
        acc.refundedPayoutCents += row.mentorPayoutCents;
      }
      return acc;
    },
    {
      totalGrossCents: 0,
      totalPlatformFeeCents: 0,
      recordedShareCents: 0,
      awaitingTransferCents: 0,
      transferredCents: 0,
      refundedPayoutCents: 0,
      sessionCount: 0,
    },
  );
}

export function mapTransactionToEarningRow(
  row: TransactionRow,
  paidTransactionIds: Set<string>,
): MentorEarningRow | null {
  if (!row.bookings) {
    return null;
  }

  const isTransferred = paidTransactionIds.has(row.id);

  return {
    id: row.id,
    bookingId: row.booking_id,
    menteeName: row.bookings.users?.full_name ?? 'Buyer',
    scheduledAt: row.bookings.scheduled_at,
    bookingStatus: row.bookings.status,
    grossCents: row.gross_amount_cents,
    platformFeeCents: row.platform_fee_cents,
    mentorPayoutCents: row.mentor_payout_cents,
    status: row.status,
    transferStatus: resolveTransferStatus(row.status, isTransferred),
    createdAt: row.created_at,
  };
}

export async function listMentorEarnings(mentorId: string): Promise<{
  summary: MentorEarningsSummary;
  rows: MentorEarningRow[];
}> {
  const paidTransactionIds = await listPaidTransactionIdsForMentor(mentorId);

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select(
      `
      id,
      booking_id,
      gross_amount_cents,
      platform_fee_cents,
      mentor_payout_cents,
      status,
      created_at,
      bookings!inner (
        scheduled_at,
        status,
        mentor_id,
        users ( full_name )
      )
    `,
    )
    .eq('bookings.mentor_id', mentorId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('listMentorEarnings:', error?.message);
    return {
      summary: summarizeMentorEarnings([]),
      rows: [],
    };
  }

  const rows = (data as TransactionRow[])
    .map((row) => mapTransactionToEarningRow(row, paidTransactionIds))
    .filter((row): row is MentorEarningRow => row !== null);

  return {
    summary: summarizeMentorEarnings(rows),
    rows,
  };
}