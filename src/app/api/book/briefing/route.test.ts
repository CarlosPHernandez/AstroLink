import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockBookingSingle = vi.hoisted(() => vi.fn());
const mockPrepareBriefing = vi.hoisted(() => vi.fn());

vi.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockBookingSingle,
        })),
      })),
    })),
  },
}));

vi.mock('@/services/agents/briefing-agent', () => ({
  BriefingAgent: vi.fn(() => ({
    prepareBriefing: mockPrepareBriefing,
  })),
}));

import { POST } from './route';

const bookingId = '00000000-0000-4000-8000-000000000124';

function makeRequest() {
  return new Request('http://localhost/api/book/briefing', {
    method: 'POST',
    body: JSON.stringify({ bookingId }),
  });
}

describe('POST /api/book/briefing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      userId: 'mentee-1',
      role: 'mentee',
    });
    mockBookingSingle.mockResolvedValue({
      data: {
        id: bookingId,
        mentee_id: 'mentee-1',
        mentor_id: 'mentor-1',
        status: 'confirmed',
      },
      error: null,
    });
    mockPrepareBriefing.mockResolvedValue({ version: 2 });
  });

  it('rejects pending payment bookings before generating a brief', async () => {
    mockBookingSingle.mockResolvedValueOnce({
      data: {
        id: bookingId,
        mentee_id: 'mentee-1',
        mentor_id: 'mentor-1',
        status: 'pending_payment',
      },
      error: null,
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(409);
    expect(mockPrepareBriefing).not.toHaveBeenCalled();
  });

  it('allows confirmed bookings to generate a brief', async () => {
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      data: { briefing: { version: 2 } },
    });
    expect(mockPrepareBriefing).toHaveBeenCalledWith(bookingId);
  });
});
