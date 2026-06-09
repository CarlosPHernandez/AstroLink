import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockBookingMaybeSingle = vi.hoisted(() => vi.fn());
const mockUserMaybeSingle = vi.hoisted(() => vi.fn());
const mockTranslateSegment = vi.hoisted(() => vi.fn());
const MockTranslationAgent = vi.hoisted(() =>
  vi.fn().mockImplementation(() => ({
    translateSegment: mockTranslateSegment,
  })),
);

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
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: mockUserMaybeSingle })),
          })),
        };
      }
      return { select: vi.fn() };
    }),
  },
}));

vi.mock('@/services/agents/translation-agent', () => ({
  TranslationAgent: MockTranslationAgent,
}));

import { POST } from '@/app/api/session/[bookingId]/translate-segment/route';

const bookingId = '00000000-0000-4000-8000-000000000099';

describe('POST /api/session/[bookingId]/translate-segment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockTranslationAgent.mockImplementation(() => ({
      translateSegment: mockTranslateSegment,
    }));
    mockGetSession.mockResolvedValue({
      userId: 'mentee-uuid',
      role: 'mentee',
    });
    mockBookingMaybeSingle.mockResolvedValue({
      data: {
        id: bookingId,
        mentee_id: 'mentee-uuid',
        mentor_id: 'mentor-uuid',
      },
      error: null,
    });
    mockUserMaybeSingle.mockResolvedValue({
      data: { preferred_locale: 'es' },
      error: null,
    });
    mockTranslateSegment.mockResolvedValue({
      segmentId: 'seg-1',
      translatedText: '[es] Hello',
      sourceLocale: 'en',
      targetLocale: 'es',
      cacheHit: false,
      estimatedInputTokens: 2,
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ segmentId: 'seg-1', text: 'Hello world' }),
      }),
      { params: Promise.resolve({ bookingId }) },
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-participant', async () => {
    mockGetSession.mockResolvedValueOnce({ userId: 'other', role: 'mentee' });
    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ segmentId: 'seg-1', text: 'Hello world' }),
      }),
      { params: Promise.resolve({ bookingId }) },
    );
    expect(res.status).toBe(403);
  });

  it('translates segment for participant using server locale', async () => {
    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          segmentId: 'seg-1',
          text: 'Hello world',
          targetLocale: 'es',
        }),
      }),
      { params: Promise.resolve({ bookingId }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.translatedText).toBe('[es] Hello');
    expect(body.latencyMs).toBeTypeOf('number');
    expect(mockTranslateSegment).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId,
        targetLocale: 'es',
        rateLimitKey: 'mentee-uuid',
      }),
    );
  });
});
