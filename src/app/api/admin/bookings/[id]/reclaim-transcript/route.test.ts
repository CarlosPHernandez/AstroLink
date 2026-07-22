import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mockRequireApiRole = vi.hoisted(() => vi.fn());
const mockFulfill = vi.hoisted(() => vi.fn());
const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockAuditInsert = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
}));

vi.mock('@/lib/post-session', () => ({
  fulfillBookingAfterTranscriptReady: (...args: unknown[]) => mockFulfill(...args),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })),
          })),
        };
      }
      if (table === 'audit_log') {
        return { insert: mockAuditInsert };
      }
      return {};
    }),
  },
}));

import { POST } from '@/app/api/admin/bookings/[id]/reclaim-transcript/route';

const adminSession = {
  userId: 'a0000003-0000-4000-8000-000000000003',
  role: 'admin' as const,
  email: 'admin@astrolink.ai',
  fullName: 'Flight Command',
  onboarded: true,
};

const bookingId = 'b0000001-0000-4000-8000-000000000001';

describe('POST /api/admin/bookings/[id]/reclaim-transcript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireApiRole.mockResolvedValue(adminSession);
    mockAuditInsert.mockResolvedValue({ error: null });
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: bookingId,
        daily_room_url: 'https://astrolink.daily.co/astrolink-booking1',
        status: 'completed',
      },
      error: null,
    });
    mockFulfill.mockResolvedValue({
      processed: true,
      bookingId,
      transcriptPersisted: true,
    });
  });

  it('returns 403 for non-admin', async () => {
    mockRequireApiRole.mockResolvedValueOnce(
      NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }),
    );
    const res = await POST(
      new Request('http://localhost/api/admin/bookings/x/reclaim-transcript', {
        method: 'POST',
        body: JSON.stringify({ transcriptId: 'tx_1' }),
      }),
      { params: Promise.resolve({ id: bookingId }) },
    );
    expect(res.status).toBe(403);
    expect(mockFulfill).not.toHaveBeenCalled();
  });

  it('returns 400 when transcriptId missing', async () => {
    const res = await POST(
      new Request('http://localhost/api/admin/bookings/x/reclaim-transcript', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: bookingId }) },
    );
    expect(res.status).toBe(400);
    expect(mockFulfill).not.toHaveBeenCalled();
  });

  it('reclaims with room name from booking', async () => {
    const res = await POST(
      new Request('http://localhost/api/admin/bookings/x/reclaim-transcript', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ transcriptId: 'tx_abc' }),
      }),
      { params: Promise.resolve({ id: bookingId }) },
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; bookingId: string };
    expect(json.success).toBe(true);
    expect(json.bookingId).toBe(bookingId);
    expect(mockFulfill).toHaveBeenCalledWith({
      transcriptId: 'tx_abc',
      roomName: 'astrolink-booking1',
    });
    expect(mockAuditInsert).toHaveBeenCalled();
  });

  it('returns 500 when access-link path throws', async () => {
    mockFulfill.mockRejectedValueOnce(new Error('Daily transcript access-link failed: 404'));
    const res = await POST(
      new Request('http://localhost/api/admin/bookings/x/reclaim-transcript', {
        method: 'POST',
        body: JSON.stringify({ transcriptId: 'tx_missing' }),
      }),
      { params: Promise.resolve({ id: bookingId }) },
    );
    expect(res.status).toBe(500);
    const json = (await res.json()) as { error: string };
    expect(json.error).toContain('access-link');
  });
});
