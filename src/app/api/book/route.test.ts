import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockBookSession = vi.hoisted(() => vi.fn());

vi.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/lib/booking-rate-limit', () => ({
  assertBookingRateLimit: vi.fn(),
  getBookingClientKey: () => 'mentee-1',
  isBookingRateLimitError: () => false,
}));

vi.mock('@/services/agents/booking-agent', () => ({
  BookingAgent: class {
    bookSession = mockBookSession;
  },
}));

import { ExpertMatchFailedError, EXPERT_MATCH_INVALID } from '@/lib/expert-match';
import { POST } from './route';

const body = {
  serviceType: 'session_1on1',
  scheduledAt: '2030-06-15T18:00:00.000Z',
  goals: 'Understand commercial crew certification path for our vehicle.',
  background: 'Series A space startup building reusable orbital tug with 12 engineers.',
  durationMinutes: 45,
};

function makeRequest() {
  return new Request('http://localhost/api/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/book (Gemini default match)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 'mentee-1', role: 'mentee' });
  });

  it('returns 422 match_failed with the honest Gemini error', async () => {
    mockBookSession.mockRejectedValue(new ExpertMatchFailedError(EXPERT_MATCH_INVALID));

    const res = await POST(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json).toEqual({
      success: false,
      error: EXPERT_MATCH_INVALID,
      code: 'match_failed',
    });
  });

  it('forwards match metadata when Gemini books without a mentorId', async () => {
    mockBookSession.mockResolvedValue({
      bookingId: 'booking-1',
      stripeClientSecret: 'pi_secret',
      skipPayment: false,
      matchReason: 'Learn propulsion',
      amountCents: 15000,
      mentorId: 'mentor-1',
      mentorSlug: 'ada-expert',
      mentorName: 'Ada Expert',
      aiMatchReason: 'Strong propulsion fit.',
      matchedByGemini: true,
    });

    const res = await POST(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      success: true,
      data: {
        bookingId: 'booking-1',
        clientSecret: 'pi_secret',
        skipPayment: false,
        matchReason: 'Learn propulsion',
        amountCents: 15000,
        mentorId: 'mentor-1',
        mentorSlug: 'ada-expert',
        mentorName: 'Ada Expert',
        aiMatchReason: 'Strong propulsion fit.',
        matchedByGemini: true,
      },
    });
    expect(mockBookSession).toHaveBeenCalledWith(
      expect.objectContaining({
        menteeId: 'mentee-1',
        mentorId: undefined,
        menteeGoals: body.goals,
      }),
    );
  });
});
