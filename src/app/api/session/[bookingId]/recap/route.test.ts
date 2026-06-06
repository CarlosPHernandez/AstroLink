import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockBookingMaybeSingle = vi.hoisted(() => vi.fn());
const mockSessionMaybeSingle = vi.hoisted(() => vi.fn());

vi.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: mockBookingMaybeSingle })),
          })),
        };
      }
      if (table === 'sessions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: mockSessionMaybeSingle })),
          })),
        };
      }
      return { select: vi.fn() };
    }),
  },
}));

import { GET } from '@/app/api/session/[bookingId]/recap/route';

describe('GET /api/session/[bookingId]/recap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      userId: 'mentee-1',
      role: 'mentee',
    });
    mockBookingMaybeSingle.mockResolvedValue({
      data: {
        id: 'booking-1',
        mentee_id: 'mentee-1',
        mentor_id: 'mentor-1',
        status: 'completed',
      },
      error: null,
    });
  });

  it('returns ready:false when session row is missing', async () => {
    mockSessionMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId: 'booking-1' }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      bookingId: 'booking-1',
      ready: false,
      recap: null,
      transcriptAvailable: false,
    });
  });

  it('returns recap when session synthesis exists', async () => {
    const recap = {
      session_summary: 'Great session',
      key_insights: ['insight'],
      action_items: [],
      mentor_feedback_prompt: 'feedback',
      recommended_next_session: 'next',
    };

    mockSessionMaybeSingle.mockResolvedValueOnce({
      data: {
        summary_json: recap,
        transcript_available: true,
        duration_seconds: 1800,
        completed_at: '2026-06-06T00:00:00Z',
      },
      error: null,
    });

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId: 'booking-1' }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ready).toBe(true);
    expect(json.recap).toEqual(recap);
    expect(json.transcriptAvailable).toBe(true);
  });

  it('returns 403 for non-participants', async () => {
    mockGetSession.mockResolvedValueOnce({
      userId: 'stranger',
      role: 'mentee',
    });

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId: 'booking-1' }),
    });

    expect(response.status).toBe(403);
  });
});
