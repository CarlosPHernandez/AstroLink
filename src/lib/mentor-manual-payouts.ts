import 'server-only';

import { supabaseAdmin } from '@/lib/supabase';

export type UnpaidMentorTransaction = {
  id: string;
  bookingId: string;
  menteeName: string;
  scheduledAt: string;
  mentorPayoutCents: number;
  createdAt: string;
};

export type MarkMentorTransactionsPaidInput = {
  mentorId: string;
  transactionIds: string[];
  adminUserId: string;
  referenceNote?: string | null;
  paidAt?: string;
};

export type MarkMentorTransactionsPaidSuccess = {
  ok: true;
  payoutId: string;
  totalCents: number;
  lineCount: number;
};

export type MarkMentorTransactionsPaidFailure = {
  ok: false;
  code:
    | 'EMPTY_SELECTION'
    | 'MENTOR_NOT_FOUND'
    | 'TRANSACTION_NOT_FOUND'
    | 'TRANSACTION_NOT_ELIGIBLE'
    | 'TRANSACTION_WRONG_MENTOR'
    | 'TRANSACTION_ALREADY_PAID';
  message: string;
  existingPayoutId?: string;
  transactionId?: string;
};

export type MarkMentorTransactionsPaidResult =
  | MarkMentorTransactionsPaidSuccess
  | MarkMentorTransactionsPaidFailure;

type TransactionCandidate = {
  id: string;
  booking_id: string;
  mentor_payout_cents: number;
  status: string;
  created_at: string;
  bookings: {
    mentor_id: string;
    scheduled_at: string;
    users: { full_name: string } | null;
  } | null;
};

type ExistingPayoutLine = {
  transaction_id: string;
  payout_id: string;
};

export function sumMentorPayoutCents(
  transactions: Array<{ mentor_payout_cents: number }>,
): number {
  return transactions.reduce((sum, row) => sum + row.mentor_payout_cents, 0);
}

export function validateMarkPaidSelection(
  requestedIds: string[],
  transactions: TransactionCandidate[],
  existingPaidIds: Set<string>,
  mentorId: string,
): MarkMentorTransactionsPaidFailure | null {
  if (requestedIds.length === 0) {
    return {
      ok: false,
      code: 'EMPTY_SELECTION',
      message: 'Select at least one session to mark paid.',
    };
  }

  const uniqueRequested = new Set(requestedIds);
  if (uniqueRequested.size !== requestedIds.length) {
    return {
      ok: false,
      code: 'TRANSACTION_NOT_FOUND',
      message: 'Duplicate transaction ids in request.',
    };
  }

  if (transactions.length !== requestedIds.length) {
    return {
      ok: false,
      code: 'TRANSACTION_NOT_FOUND',
      message: 'One or more transactions were not found.',
    };
  }

  for (const transaction of transactions) {
    if (!transaction.bookings) {
      return {
        ok: false,
        code: 'TRANSACTION_NOT_FOUND',
        message: 'One or more transactions are missing booking context.',
        transactionId: transaction.id,
      };
    }

    if (transaction.bookings.mentor_id !== mentorId) {
      return {
        ok: false,
        code: 'TRANSACTION_WRONG_MENTOR',
        message: 'One or more transactions do not belong to this mentor.',
        transactionId: transaction.id,
      };
    }

    if (transaction.status !== 'completed') {
      return {
        ok: false,
        code: 'TRANSACTION_NOT_ELIGIBLE',
        message: 'Only completed payments can be marked paid.',
        transactionId: transaction.id,
      };
    }

    if (existingPaidIds.has(transaction.id)) {
      return {
        ok: false,
        code: 'TRANSACTION_ALREADY_PAID',
        message: 'One or more sessions were already marked paid.',
        transactionId: transaction.id,
      };
    }
  }

  return null;
}

export async function listPaidTransactionIdsForMentor(mentorId: string): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from('mentor_payout_lines')
    .select(
      `
      transaction_id,
      transactions!inner (
        bookings!inner ( mentor_id )
      )
    `,
    )
    .eq('transactions.bookings.mentor_id', mentorId);

  if (error || !data) {
    console.error('listPaidTransactionIdsForMentor:', error?.message);
    return new Set();
  }

  return new Set(data.map((row) => row.transaction_id));
}

export async function listUnpaidMentorTransactions(
  mentorId: string,
): Promise<UnpaidMentorTransaction[]> {
  const paidIds = await listPaidTransactionIdsForMentor(mentorId);

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select(
      `
      id,
      booking_id,
      mentor_payout_cents,
      status,
      created_at,
      bookings!inner (
        mentor_id,
        scheduled_at,
        users ( full_name )
      )
    `,
    )
    .eq('bookings.mentor_id', mentorId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('listUnpaidMentorTransactions:', error?.message);
    return [];
  }

  return (data as TransactionCandidate[])
    .filter((row) => row.bookings && !paidIds.has(row.id))
    .map((row) => ({
      id: row.id,
      bookingId: row.booking_id,
      menteeName: row.bookings?.users?.full_name ?? 'Buyer',
      scheduledAt: row.bookings!.scheduled_at,
      mentorPayoutCents: row.mentor_payout_cents,
      createdAt: row.created_at,
    }));
}

export async function getMentorAwaitingTransferCents(mentorId: string): Promise<number> {
  const unpaid = await listUnpaidMentorTransactions(mentorId);
  return sumMentorPayoutCents(unpaid.map((row) => ({ mentor_payout_cents: row.mentorPayoutCents })));
}

export type MentorAwaitingPayoutSummary = {
  mentorId: string;
  fullName: string;
  awaitingCents: number;
};

export async function listAllPaidTransactionIds(): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from('mentor_payout_lines')
    .select('transaction_id');

  if (error || !data) {
    console.error('listAllPaidTransactionIds:', error?.message);
    return new Set();
  }

  return new Set(data.map((row) => row.transaction_id));
}

export async function listMentorsWithAwaitingPayouts(): Promise<MentorAwaitingPayoutSummary[]> {
  const paidIds = await listAllPaidTransactionIds();

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select(
      `
      id,
      mentor_payout_cents,
      status,
      bookings!inner (
        mentor_id,
        mentors!inner ( id, full_name )
      )
    `,
    )
    .eq('status', 'completed');

  if (error || !data) {
    console.error('listMentorsWithAwaitingPayouts:', error?.message);
    return [];
  }

  const byMentor = new Map<string, MentorAwaitingPayoutSummary>();

  for (const row of data) {
    if (paidIds.has(row.id)) {
      continue;
    }

    const booking = row.bookings as {
      mentor_id: string;
      mentors: { id: string; full_name: string };
    } | null;
    if (!booking?.mentors) {
      continue;
    }

    const mentorId = booking.mentors.id;
    const existing = byMentor.get(mentorId);
    if (existing) {
      existing.awaitingCents += row.mentor_payout_cents;
    } else {
      byMentor.set(mentorId, {
        mentorId,
        fullName: booking.mentors.full_name,
        awaitingCents: row.mentor_payout_cents,
      });
    }
  }

  return [...byMentor.values()]
    .filter((mentor) => mentor.awaitingCents > 0)
    .sort((a, b) => b.awaitingCents - a.awaitingCents);
}

export async function getMentorTransferredCents(mentorId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('mentor_payout_lines')
    .select(
      `
      amount_cents,
      transactions!inner (
        bookings!inner ( mentor_id )
      )
    `,
    )
    .eq('transactions.bookings.mentor_id', mentorId);

  if (error || !data) {
    console.error('getMentorTransferredCents:', error?.message);
    return 0;
  }

  return data.reduce((sum, row) => sum + row.amount_cents, 0);
}

async function findExistingPayoutForTransactions(
  transactionIds: string[],
): Promise<ExistingPayoutLine | null> {
  const { data, error } = await supabaseAdmin
    .from('mentor_payout_lines')
    .select('transaction_id, payout_id')
    .in('transaction_id', transactionIds)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('findExistingPayoutForTransactions:', error.message);
    return null;
  }

  return data;
}

async function deletePayoutIfEmpty(payoutId: string): Promise<void> {
  const { count, error: countError } = await supabaseAdmin
    .from('mentor_payout_lines')
    .select('id', { count: 'exact', head: true })
    .eq('payout_id', payoutId);

  if (countError) {
    console.error('deletePayoutIfEmpty count:', countError.message);
    return;
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const { error } = await supabaseAdmin.from('mentor_manual_payouts').delete().eq('id', payoutId);
  if (error) {
    console.error('deletePayoutIfEmpty delete:', error.message);
  }
}

export async function markMentorTransactionsPaid(
  input: MarkMentorTransactionsPaidInput,
): Promise<MarkMentorTransactionsPaidResult> {
  const { mentorId, transactionIds, adminUserId, referenceNote, paidAt } = input;

  const { data: mentor, error: mentorError } = await supabaseAdmin
    .from('mentors')
    .select('id')
    .eq('id', mentorId)
    .maybeSingle();

  if (mentorError) {
    console.error('markMentorTransactionsPaid mentor:', mentorError.message);
    return { ok: false, code: 'MENTOR_NOT_FOUND', message: 'Could not load mentor.' };
  }

  if (!mentor) {
    return { ok: false, code: 'MENTOR_NOT_FOUND', message: 'Mentor not found.' };
  }

  const existingLine = await findExistingPayoutForTransactions(transactionIds);
  if (existingLine) {
    return {
      ok: false,
      code: 'TRANSACTION_ALREADY_PAID',
      message: 'One or more sessions were already marked paid.',
      existingPayoutId: existingLine.payout_id,
      transactionId: existingLine.transaction_id,
    };
  }

  const { data: transactions, error: txError } = await supabaseAdmin
    .from('transactions')
    .select(
      `
      id,
      booking_id,
      mentor_payout_cents,
      status,
      created_at,
      bookings!inner (
        mentor_id,
        scheduled_at,
        users ( full_name )
      )
    `,
    )
    .in('id', transactionIds);

  if (txError || !transactions) {
    console.error('markMentorTransactionsPaid transactions:', txError?.message);
    return {
      ok: false,
      code: 'TRANSACTION_NOT_FOUND',
      message: 'Could not load transactions.',
    };
  }

  const paidIds = await listPaidTransactionIdsForMentor(mentorId);
  const validationError = validateMarkPaidSelection(
    transactionIds,
    transactions as TransactionCandidate[],
    paidIds,
    mentorId,
  );
  if (validationError) {
    return validationError;
  }

  const totalCents = sumMentorPayoutCents(transactions);
  if (totalCents <= 0) {
    return {
      ok: false,
      code: 'TRANSACTION_NOT_ELIGIBLE',
      message: 'Selected sessions have no payable mentor share.',
    };
  }

  const { data: payout, error: payoutError } = await supabaseAdmin
    .from('mentor_manual_payouts')
    .insert({
      mentor_id: mentorId,
      total_cents: totalCents,
      reference_note: referenceNote?.trim() || null,
      paid_at: paidAt ?? new Date().toISOString(),
      created_by_admin_id: adminUserId,
    })
    .select('id')
    .single();

  if (payoutError || !payout) {
    console.error('markMentorTransactionsPaid payout:', payoutError?.message);
    return {
      ok: false,
      code: 'TRANSACTION_NOT_ELIGIBLE',
      message: 'Could not create payout batch.',
    };
  }

  const lines = transactions.map((row) => ({
    payout_id: payout.id,
    transaction_id: row.id,
    amount_cents: row.mentor_payout_cents,
  }));

  const { error: linesError } = await supabaseAdmin.from('mentor_payout_lines').insert(lines);

  if (linesError) {
    console.error('markMentorTransactionsPaid lines:', linesError.message);
    await deletePayoutIfEmpty(payout.id);

    if (linesError.code === '23505') {
      const conflict = await findExistingPayoutForTransactions(transactionIds);
      return {
        ok: false,
        code: 'TRANSACTION_ALREADY_PAID',
        message: 'One or more sessions were already marked paid.',
        existingPayoutId: conflict?.payout_id,
        transactionId: conflict?.transaction_id,
      };
    }

    return {
      ok: false,
      code: 'TRANSACTION_NOT_ELIGIBLE',
      message: 'Could not record payout lines.',
    };
  }

  const { error: auditError } = await supabaseAdmin.from('audit_log').insert({
    agent_id: 'APX-05',
    event: 'MENTOR_MANUAL_PAYOUT_CREATED',
    ref_id: payout.id,
    payload: {
      mentor_id: mentorId,
      admin_user_id: adminUserId,
      transaction_ids: transactionIds,
      total_cents: totalCents,
      reference_note: referenceNote?.trim() || null,
    },
  });

  if (auditError) {
    console.error('markMentorTransactionsPaid audit:', auditError.message);
  }

  return {
    ok: true,
    payoutId: payout.id,
    totalCents,
    lineCount: lines.length,
  };
}