import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import {
  listUnpaidMentorTransactions,
  markMentorTransactionsPaid,
  sumMentorPayoutCents,
  validateMarkPaidSelection,
} from '@/lib/mentor-manual-payouts';

const mentorId = 'a0000002-0000-4000-8000-000000000002';
const adminId = 'a0000003-0000-4000-8000-000000000003';
const tx1 = 'b0000001-0000-4000-8000-000000000001';
const tx2 = 'b0000002-0000-4000-8000-000000000002';

function completedTransaction(
  id: string,
  payoutCents: number,
  mentor = mentorId,
): {
  id: string;
  booking_id: string;
  mentor_payout_cents: number;
  status: string;
  created_at: string;
  bookings: {
    mentor_id: string;
    scheduled_at: string;
    users: { full_name: string };
  };
} {
  return {
    id,
    booking_id: `booking-${id}`,
    mentor_payout_cents: payoutCents,
    status: 'completed',
    created_at: '2026-06-10T12:00:00Z',
    bookings: {
      mentor_id: mentor,
      scheduled_at: '2026-06-12T15:00:00Z',
      users: { full_name: 'Alex Buyer' },
    },
  };
}

describe('sumMentorPayoutCents', () => {
  it('sums mentor payout cents', () => {
    expect(
      sumMentorPayoutCents([
        { mentor_payout_cents: 8000 },
        { mentor_payout_cents: 16000 },
      ]),
    ).toBe(24000);
  });
});

describe('validateMarkPaidSelection', () => {
  it('rejects empty selection', () => {
    expect(
      validateMarkPaidSelection([], [], new Set(), mentorId),
    ).toMatchObject({ code: 'EMPTY_SELECTION' });
  });

  it('rejects transactions for another mentor', () => {
    const result = validateMarkPaidSelection(
      [tx1],
      [completedTransaction(tx1, 8000, 'other-mentor')],
      new Set(),
      mentorId,
    );
    expect(result).toMatchObject({ code: 'TRANSACTION_WRONG_MENTOR', transactionId: tx1 });
  });

  it('rejects non-completed transactions', () => {
    const row = completedTransaction(tx1, 8000);
    row.status = 'refunded';
    expect(validateMarkPaidSelection([tx1], [row], new Set(), mentorId)).toMatchObject({
      code: 'TRANSACTION_NOT_ELIGIBLE',
    });
  });

  it('rejects already paid transactions', () => {
    expect(
      validateMarkPaidSelection(
        [tx1],
        [completedTransaction(tx1, 8000)],
        new Set([tx1]),
        mentorId,
      ),
    ).toMatchObject({ code: 'TRANSACTION_ALREADY_PAID', transactionId: tx1 });
  });

  it('accepts eligible completed transactions', () => {
    expect(
      validateMarkPaidSelection(
        [tx1, tx2],
        [completedTransaction(tx1, 8000), completedTransaction(tx2, 12000)],
        new Set(),
        mentorId,
      ),
    ).toBeNull();
  });
});

describe('listUnpaidMentorTransactions', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('excludes transactions that already have payout lines', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'mentor_payout_lines') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [{ transaction_id: tx1 }],
              error: null,
            }),
          })),
        };
      }
      if (table === 'transactions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: [completedTransaction(tx1, 8000), completedTransaction(tx2, 12000)],
                  error: null,
                }),
              })),
            })),
          })),
        };
      }
      return { select: vi.fn() };
    });

    const rows = await listUnpaidMentorTransactions(mentorId);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe(tx2);
    expect(rows[0]?.mentorPayoutCents).toBe(12000);
  });
});

describe('markMentorTransactionsPaid', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('creates payout batch and lines for eligible transactions', async () => {
    const payoutInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: 'payout-1' },
          error: null,
        }),
      })),
    }));
    const linesInsert = vi.fn().mockResolvedValue({ error: null });
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'mentors') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: mentorId }, error: null }),
            })),
          })),
        };
      }
      if (table === 'mentor_payout_lines') {
        return {
          insert: linesInsert,
          select: vi.fn((columns?: string, options?: { count?: string; head?: boolean }) => {
            if (options?.head) {
              return {
                eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
              };
            }
            if (columns === 'transaction_id, payout_id') {
              return {
                in: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  })),
                })),
              };
            }
            return {
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }),
        };
      }
      if (table === 'transactions') {
        return {
          select: vi.fn(() => ({
            in: vi.fn().mockResolvedValue({
              data: [completedTransaction(tx1, 8000)],
              error: null,
            }),
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              })),
            })),
          })),
        };
      }
      if (table === 'mentor_manual_payouts') {
        return { insert: payoutInsert };
      }
      if (table === 'audit_log') {
        return { insert: auditInsert };
      }
      return { select: vi.fn() };
    });

    const result = await markMentorTransactionsPaid({
      mentorId,
      transactionIds: [tx1],
      adminUserId: adminId,
      referenceNote: 'Wire 1234',
    });

    expect(result).toEqual({
      ok: true,
      payoutId: 'payout-1',
      totalCents: 8000,
      lineCount: 1,
    });
    expect(payoutInsert).toHaveBeenCalled();
    expect(linesInsert).toHaveBeenCalledWith([
      { payout_id: 'payout-1', transaction_id: tx1, amount_cents: 8000 },
    ]);
    expect(auditInsert).toHaveBeenCalled();
  });

  it('returns already paid when payout line exists', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'mentors') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: mentorId }, error: null }),
            })),
          })),
        };
      }
      if (table === 'mentor_payout_lines') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { transaction_id: tx1, payout_id: 'existing-payout' },
                  error: null,
                }),
              })),
            })),
          })),
        };
      }
      return { select: vi.fn() };
    });

    const result = await markMentorTransactionsPaid({
      mentorId,
      transactionIds: [tx1],
      adminUserId: adminId,
    });

    expect(result).toMatchObject({
      ok: false,
      code: 'TRANSACTION_ALREADY_PAID',
      existingPayoutId: 'existing-payout',
      transactionId: tx1,
    });
  });
});