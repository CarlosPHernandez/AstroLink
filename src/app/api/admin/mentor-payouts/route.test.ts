import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mockRequireApiRole = vi.hoisted(() => vi.fn());
const mockListMentorsWithAwaitingPayouts = vi.hoisted(() => vi.fn());
const mockListUnpaidMentorTransactions = vi.hoisted(() => vi.fn());
const mockGetMentorAwaitingTransferCents = vi.hoisted(() => vi.fn());
const mockMarkMentorTransactionsPaid = vi.hoisted(() => vi.fn());
const mockMentorMaybeSingle = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
}));

vi.mock('@/lib/mentor-manual-payouts', () => ({
  listMentorsWithAwaitingPayouts: (...args: unknown[]) =>
    mockListMentorsWithAwaitingPayouts(...args),
  listUnpaidMentorTransactions: (...args: unknown[]) =>
    mockListUnpaidMentorTransactions(...args),
  getMentorAwaitingTransferCents: (...args: unknown[]) =>
    mockGetMentorAwaitingTransferCents(...args),
  markMentorTransactionsPaid: (...args: unknown[]) => mockMarkMentorTransactionsPaid(...args),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'mentors') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: mockMentorMaybeSingle,
            })),
          })),
        };
      }
      return { select: vi.fn() };
    }),
  },
}));

const adminSession = {
  userId: 'a0000003-0000-4000-8000-000000000003',
  role: 'admin' as const,
  email: 'admin@astrolink.ai',
  fullName: 'Flight Command',
  onboarded: true,
};

const mentorId = 'a0000002-0000-4000-8000-000000000002';
const txId = 'b0000001-0000-4000-8000-000000000001';

describe('/api/admin/mentor-payouts', () => {
  beforeEach(() => {
    vi.resetModules();
    mockRequireApiRole.mockReset();
    mockListMentorsWithAwaitingPayouts.mockReset();
    mockListUnpaidMentorTransactions.mockReset();
    mockGetMentorAwaitingTransferCents.mockReset();
    mockMarkMentorTransactionsPaid.mockReset();
    mockMentorMaybeSingle.mockReset();
  });

  it('GET returns mentors awaiting payout when mentorId is omitted', async () => {
    mockRequireApiRole.mockResolvedValue(adminSession);
    mockListMentorsWithAwaitingPayouts.mockResolvedValue([
      { mentorId, fullName: 'Chris Sembroski', awaitingCents: 8000 },
    ]);

    const { GET } = await import('./route');
    const response = await GET(new Request('http://127.0.0.1:3000/api/admin/mentor-payouts'));
    const json = (await response.json()) as {
      success: boolean;
      mentors: Array<{ mentorId: string }>;
    };

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.mentors).toHaveLength(1);
  });

  it('GET returns unpaid transactions for a mentor', async () => {
    mockRequireApiRole.mockResolvedValue(adminSession);
    mockMentorMaybeSingle.mockResolvedValue({
      data: { id: mentorId, full_name: 'Chris Sembroski' },
      error: null,
    });
    mockListUnpaidMentorTransactions.mockResolvedValue([
      {
        id: txId,
        bookingId: 'booking-1',
        menteeName: 'Alex',
        scheduledAt: '2026-06-12T15:00:00Z',
        mentorPayoutCents: 8000,
        createdAt: '2026-06-10T12:00:00Z',
      },
    ]);
    mockGetMentorAwaitingTransferCents.mockResolvedValue(8000);

    const { GET } = await import('./route');
    const response = await GET(
      new Request(`http://127.0.0.1:3000/api/admin/mentor-payouts?mentorId=${mentorId}`),
    );
    const json = (await response.json()) as {
      success: boolean;
      mentor: { awaitingCents: number };
      unpaidTransactions: Array<{ id: string }>;
    };

    expect(response.status).toBe(200);
    expect(json.mentor.awaitingCents).toBe(8000);
    expect(json.unpaidTransactions[0]?.id).toBe(txId);
  });

  it('POST marks selected transactions paid', async () => {
    mockRequireApiRole.mockResolvedValue(adminSession);
    mockMarkMentorTransactionsPaid.mockResolvedValue({
      ok: true,
      payoutId: 'payout-1',
      totalCents: 8000,
      lineCount: 1,
    });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://127.0.0.1:3000/api/admin/mentor-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId,
          transactionIds: [txId],
          referenceNote: 'Wire 1234',
        }),
      }),
    );
    const json = (await response.json()) as { success: boolean; payoutId: string };

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.payoutId).toBe('payout-1');
  });

  it('POST returns 409 when transaction already paid', async () => {
    mockRequireApiRole.mockResolvedValue(adminSession);
    mockMarkMentorTransactionsPaid.mockResolvedValue({
      ok: false,
      code: 'TRANSACTION_ALREADY_PAID',
      message: 'Already paid.',
      existingPayoutId: 'existing-payout',
      transactionId: txId,
    });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://127.0.0.1:3000/api/admin/mentor-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId, transactionIds: [txId] }),
      }),
    );

    expect(response.status).toBe(409);
  });

  it('returns auth response when session is missing', async () => {
    mockRequireApiRole.mockResolvedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
    );

    const { GET } = await import('./route');
    const response = await GET(new Request('http://127.0.0.1:3000/api/admin/mentor-payouts'));
    expect(response.status).toBe(401);
  });
});