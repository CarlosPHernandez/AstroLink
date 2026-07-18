import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockVerify = vi.fn();
const mockGenerateSlots = vi.fn();
const mockFindSlot = vi.fn();
const mockGetSession = vi.fn();
const mockSendEmail = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/chris-campaign/chris-slot-choice-token', () => ({
  verifyChrisSlotToken: (...args: unknown[]) => mockVerify(...args),
}));

vi.mock('@/lib/chris-campaign/chris-availability-slots', () => ({
  generateSlotsForBlocks: (...args: unknown[]) => mockGenerateSlots(...args),
  findSlotByStartUtc: (...args: unknown[]) => mockFindSlot(...args),
}));

vi.mock('@/lib/chris-campaign/chris-campaign-config', () => ({
  getChrisCampaignId: () => 'chris-sembroski',
}));

vi.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/lib/email/resend-client', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { CHRIS_SLOT_OPS_NOTIFY_EMAIL, POST } from '@/app/api/chris-slot-choice/route';

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/chris-slot-choice', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/chris-slot-choice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
    mockSendEmail.mockResolvedValue({ ok: true, messageId: 'msg_1' });
    mockGenerateSlots.mockReturnValue([
      {
        dayKey: 'tue',
        isoDate: '2026-07-21',
        startUtcIso: '2026-07-21T19:00:00.000Z',
        endUtcIso: '2026-07-21T19:45:00.000Z',
        label: 'Tue, Jul 21 · 12:00–12:45 PM PDT',
        timeRangeLabel: '12:00–12:45 PM',
      },
    ]);
    mockFindSlot.mockReturnValue({
      dayKey: 'tue',
      isoDate: '2026-07-21',
      startUtcIso: '2026-07-21T19:00:00.000Z',
      endUtcIso: '2026-07-21T19:45:00.000Z',
      label: 'Tue, Jul 21 · 12:00–12:45 PM PDT',
      timeRangeLabel: '12:00–12:45 PM',
    });
    mockVerify.mockReturnValue({
      ok: true,
      payload: {
        v: 1,
        bookingId: 'book-1',
        email: 'alex@example.com',
        exp: 9_999_999_999,
        blocks: [],
      },
    });
  });

  it('updates scheduled_at and emails support@astro-link.space', async () => {
    const selectSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'book-1',
        status: 'confirmed',
        scheduled_at: '2026-07-20T19:00:00.000Z',
        mentee_id: 'user-1',
        campaign_id: 'chris-sembroski',
        duration_minutes: 45,
        users: { email: 'alex@example.com', full_name: 'Alex' },
      },
      error: null,
    });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table !== 'bookings') throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({
          eq: () => ({
            single: selectSingle,
          }),
        }),
        update: () => ({
          eq: updateEq,
        }),
      };
    });

    const res = await POST(
      jsonRequest({
        token: 'a'.repeat(20),
        startUtcIso: '2026-07-21T19:00:00.000Z',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.label).toContain('Jul 21');
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: CHRIS_SLOT_OPS_NOTIFY_EMAIL,
      }),
    );
    expect(CHRIS_SLOT_OPS_NOTIFY_EMAIL).toBe('support@astro-link.space');
  });

  it('rejects expired tokens with 410', async () => {
    mockVerify.mockReturnValue({ ok: false, reason: 'expired' });
    const res = await POST(
      jsonRequest({
        token: 'a'.repeat(20),
        startUtcIso: '2026-07-21T19:00:00.000Z',
      }),
    );
    expect(res.status).toBe(410);
  });

  it('rejects slots outside the offer', async () => {
    mockFindSlot.mockReturnValue(undefined);
    const res = await POST(
      jsonRequest({
        token: 'a'.repeat(20),
        startUtcIso: '2026-07-21T19:00:00.000Z',
      }),
    );
    expect(res.status).toBe(400);
  });
});
