import 'server-only';

import {
  type MentorEarningRow,
  type MentorEarningStatus,
  type MentorEarningsSummary,
} from '@/lib/mentor-earnings-types';
import { supabaseAdmin } from '@/lib/supabase';
import type { BookingStatus } from '@/lib/types';

export type { MentorEarningRow, MentorEarningsSummary, MentorEarningStatus } from '@/lib/mentor-earnings-types';

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

export function summarizeMentorEarnings(rows: MentorEarningRow[]): MentorEarningsSummary {
  return rows.reduce<MentorEarningsSummary>(
    (acc, row) => {
      acc.totalGrossCents += row.grossCents;
      acc.totalPlatformFeeCents += row.platformFeeCents;
      acc.totalPayoutCents += row.mentorPayoutCents;
      if (row.status === 'pending') {
        acc.pendingPayoutCents += row.mentorPayoutCents;
      }
      if (row.status === 'completed') {
        acc.completedPayoutCents += row.mentorPayoutCents;
      }
      acc.sessionCount += 1;
      return acc;
    },
    {
      totalGrossCents: 0,
      totalPlatformFeeCents: 0,
      totalPayoutCents: 0,
      pendingPayoutCents: 0,
      completedPayoutCents: 0,
      sessionCount: 0,
    },
  );
}

export function mapTransactionToEarningRow(row: TransactionRow): MentorEarningRow | null {
  if (!row.bookings) {
    return null;
  }

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
    createdAt: row.created_at,
  };
}

export async function listMentorEarnings(mentorId: string): Promise<{
  summary: MentorEarningsSummary;
  rows: MentorEarningRow[];
}> {
  const { data: mentorBookings, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('mentor_id', mentorId);

  if (bookingsError) {
    console.error('listMentorEarnings bookings:', bookingsError.message);
    return { summary: summarizeMentorEarnings([]), rows: [] };
  }

  const bookingIds = (mentorBookings ?? []).map((row) => row.id);
  if (bookingIds.length === 0) {
    return { summary: summarizeMentorEarnings([]), rows: [] };
  }

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
      bookings (
        scheduled_at,
        status,
        users ( full_name )
      )
    `,
    )
    .in('booking_id', bookingIds)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('listMentorEarnings:', error?.message);
    return {
      summary: summarizeMentorEarnings([]),
      rows: [],
    };
  }

  const rows = (data as TransactionRow[])
    .map(mapTransactionToEarningRow)
    .filter((row): row is MentorEarningRow => row !== null);

  return {
    summary: summarizeMentorEarnings(rows),
    rows,
  };
}
