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
import { LlmRateLimitError } from '@/lib/llm-rate-limit';
import { TranslateSegmentError } from '@/lib/transcript-translation/translate-segment';

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

  it('translates segment for mentee using server locale', async () => {
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

  it('honors a mentee targetLocale even when the saved profile is still English', async () => {
    mockUserMaybeSingle.mockResolvedValueOnce({
      data: { preferred_locale: 'en' },
      error: null,
    });
    mockTranslateSegment.mockResolvedValueOnce({
      segmentId: 'seg-join',
      translatedText: '[es] Hello world',
      sourceLocale: 'en',
      targetLocale: 'es',
      cacheHit: false,
      estimatedInputTokens: 2,
    });

    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          segmentId: 'seg-join',
          text: 'Hello world',
          sourceLocale: 'en',
          targetLocale: 'es',
        }),
      }),
      { params: Promise.resolve({ bookingId }) },
    );

    expect(res.status).toBe(200);
    expect(mockTranslateSegment).toHaveBeenCalledWith(
      expect.objectContaining({
        targetLocale: 'es',
      }),
    );
  });

  it('allows mentor viewer to target English with non-en sourceLocale', async () => {
    mockGetSession.mockResolvedValueOnce({
      userId: 'mentor-uuid',
      role: 'mentor',
    });
    mockUserMaybeSingle.mockResolvedValueOnce({
      data: { preferred_locale: 'es' },
      error: null,
    });
    mockTranslateSegment.mockResolvedValueOnce({
      segmentId: 'seg-es',
      translatedText: 'We should review the architecture.',
      sourceLocale: 'es',
      targetLocale: 'en',
      cacheHit: false,
      estimatedInputTokens: 4,
    });

    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          segmentId: 'seg-es',
          text: 'Debemos revisar la arquitectura.',
          sourceLocale: 'es',
          targetLocale: 'en',
        }),
      }),
      { params: Promise.resolve({ bookingId }) },
    );

    expect(res.status).toBe(200);
    expect(mockTranslateSegment).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceLocale: 'es',
        targetLocale: 'en',
      }),
    );
  });

  it('returns 429 with rate_limited code when LLM rate limit is hit', async () => {
    mockTranslateSegment.mockRejectedValueOnce(
      new LlmRateLimitError('Caption translation rate limit reached', 12_000),
    );

    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          segmentId: 'seg-rate',
          text: 'Debemos revisar la arquitectura.',
          sourceLocale: 'es',
          targetLocale: 'es',
        }),
      }),
      { params: Promise.resolve({ bookingId }) },
    );

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.code).toBe('rate_limited');
    expect(body.retryAfterMs).toBe(12_000);
  });

  it('returns 400 when mentee requests an unsupported targetLocale', async () => {
    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          segmentId: 'seg-de',
          text: 'Hello world',
          targetLocale: 'de',
        }),
      }),
      { params: Promise.resolve({ bookingId }) },
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'targetLocale mismatch' });
    expect(mockTranslateSegment).not.toHaveBeenCalled();
  });

  it('returns 400 when a mentor requests a non-English targetLocale', async () => {
    mockGetSession.mockResolvedValueOnce({
      userId: 'mentor-uuid',
      role: 'mentor',
    });

    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          segmentId: 'seg-mismatch',
          text: 'Debemos revisar la arquitectura.',
          sourceLocale: 'es',
          targetLocale: 'es',
        }),
      }),
      { params: Promise.resolve({ bookingId }) },
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'targetLocale mismatch' });
  });

  it('returns 400 for invalid JSON and missing fields', async () => {
    const invalid = await POST(new Request('http://localhost', { method: 'POST', body: '{bad' }), {
      params: Promise.resolve({ bookingId }),
    });
    expect(invalid.status).toBe(400);

    const missing = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ segmentId: '   ', text: '' }),
      }),
      { params: Promise.resolve({ bookingId }) },
    );
    expect(missing.status).toBe(400);
    expect(await missing.json()).toEqual({ error: 'segmentId and text are required' });
  });

  it('returns 404 when the booking is missing', async () => {
    mockBookingMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ segmentId: 'seg-1', text: 'Hello world' }),
      }),
      { params: Promise.resolve({ bookingId }) },
    );
    expect(res.status).toBe(404);
  });

  it('maps TranslateSegmentError codes to 400 or 422', async () => {
    mockTranslateSegment.mockRejectedValueOnce(
      new TranslateSegmentError('Segment text too short', 'text_too_short'),
    );
    const shortRes = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ segmentId: 'seg-1', text: 'Hello world', targetLocale: 'es' }),
      }),
      { params: Promise.resolve({ bookingId }) },
    );
    expect(shortRes.status).toBe(400);
    expect((await shortRes.json()).code).toBe('text_too_short');

    mockTranslateSegment.mockRejectedValueOnce(
      new TranslateSegmentError('Translation skipped for same language', 'same_language'),
    );
    const sameRes = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ segmentId: 'seg-1', text: 'Hello world', targetLocale: 'es' }),
      }),
      { params: Promise.resolve({ bookingId }) },
    );
    expect(sameRes.status).toBe(422);
    expect((await sameRes.json()).code).toBe('same_language');
  });

  it('defaults sourceLocale to en and allows admin participants', async () => {
    mockGetSession.mockResolvedValueOnce({
      userId: 'admin-uuid',
      role: 'admin',
    });

    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          segmentId: 'seg-admin',
          text: 'Hello world',
        }),
      }),
      { params: Promise.resolve({ bookingId }) },
    );

    expect(res.status).toBe(200);
    expect(mockTranslateSegment).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceLocale: 'en',
        targetLocale: 'en',
      }),
    );
  });
});
