import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockFulfill = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/lib/post-session', () => ({
  fulfillBookingAfterMeetingEndedForBooking: (...args: unknown[]) => mockFulfill(...args),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { POST } from './route';

describe('POST /api/session/[bookingId]/complete', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockFulfill.mockReset();
    mockFrom.mockReset();
  });

  it('rejects unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await POST(new Request('http://localhost/api/session/x/complete'), {
      params: Promise.resolve({ bookingId: '11111111-1111-4111-8111-111111111111' }),
    });
    expect(res.status).toBe(401);
  });

  it('completes for mentee participant', async () => {
    const bookingId = '11111111-1111-4111-8111-111111111111';
    mockGetSession.mockResolvedValue({
      userId: 'mentee-1',
      role: 'mentee',
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              id: bookingId,
              status: 'confirmed',
              mentee_id: 'mentee-1',
              mentor_id: 'mentor-1',
              daily_room_url: 'https://astrolink.daily.co/astrolink-abc',
              duration_minutes: 15,
              scheduled_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      }),
    });
    mockFulfill.mockResolvedValue({ processed: true, bookingId, alreadyProcessed: false });

    const res = await POST(new Request('http://localhost/api/session/x/complete', { method: 'POST' }), {
      params: Promise.resolve({ bookingId }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockFulfill).toHaveBeenCalledWith(
      bookingId,
      expect.objectContaining({
        room: 'astrolink-abc',
        start_ts: expect.any(Number),
        end_ts: expect.any(Number),
      }),
    );
  });

  it('forbids non-participants', async () => {
    const bookingId = '11111111-1111-4111-8111-111111111111';
    mockGetSession.mockResolvedValue({ userId: 'other', role: 'mentee' });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              id: bookingId,
              status: 'confirmed',
              mentee_id: 'mentee-1',
              mentor_id: 'mentor-1',
              daily_room_url: null,
              duration_minutes: 15,
              scheduled_at: null,
            },
            error: null,
          }),
        }),
      }),
    });

    const res = await POST(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId }),
    });
    expect(res.status).toBe(403);
    expect(mockFulfill).not.toHaveBeenCalled();
  });
});
