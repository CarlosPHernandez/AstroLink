import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockBookingMaybeSingle = vi.hoisted(() => vi.fn());
const mockSessionMaybeSingle = vi.hoisted(() => vi.fn());
const mockUserMaybeSingle = vi.hoisted(() => vi.fn());
const mockTranslationsSelect = vi.hoisted(() => vi.fn());
const mockAuditSelect = vi.hoisted(() => vi.fn());

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
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: mockUserMaybeSingle })),
          })),
        };
      }
      if (table === 'session_translations') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: mockTranslationsSelect,
            })),
          })),
        };
      }
      if (table === 'audit_log') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  limit: mockAuditSelect,
                })),
              })),
            })),
          })),
        };
      }
      return { select: vi.fn() };
    }),
  },
}));

import { GET } from '@/app/api/session/[bookingId]/recap/route';

const englishRecap = {
  session_summary: 'English summary',
  key_insights: ['insight'],
  action_items: [],
  mentor_feedback_prompt: 'feedback',
  recommended_next_session: 'next',
};

const portugueseRecap = {
  session_summary: '[pt-BR] Portuguese summary',
  key_insights: ['[pt-BR] insight'],
  action_items: [],
  mentor_feedback_prompt: '[pt-BR] feedback',
  recommended_next_session: '[pt-BR] next',
};

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
    mockUserMaybeSingle.mockResolvedValue({
      data: { preferred_locale: 'pt-BR' },
      error: null,
    });
    mockTranslationsSelect.mockResolvedValue({ data: [], error: null });
    mockAuditSelect.mockResolvedValue({ data: [], error: null });
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
      locale: 'pt-BR',
    });
  });

  it('returns localized recap for mentee default pt-BR (D4)', async () => {
    mockSessionMaybeSingle.mockResolvedValueOnce({
      data: {
        summary_json: englishRecap,
        transcript_available: true,
        duration_seconds: 1800,
        completed_at: '2026-06-06T00:00:00Z',
      },
      error: null,
    });
    mockTranslationsSelect.mockResolvedValueOnce({
      data: [{ target_locale: 'pt-BR', summary_json: portugueseRecap }],
      error: null,
    });

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId: 'booking-1' }),
    });

    const json = await response.json();
    expect(json.ready).toBe(true);
    expect(json.recap).toEqual(portugueseRecap);
    expect(json.locale).toBe('pt-BR');
    expect(json.localized).toBe(true);
  });

  it('returns English recap for mentor default locale', async () => {
    mockGetSession.mockResolvedValueOnce({
      userId: 'mentor-1',
      role: 'mentor',
    });
    mockSessionMaybeSingle.mockResolvedValueOnce({
      data: {
        summary_json: englishRecap,
        transcript_available: false,
        duration_seconds: 1800,
        completed_at: '2026-06-06T00:00:00Z',
      },
      error: null,
    });

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId: 'booking-1' }),
    });

    const json = await response.json();
    expect(json.locale).toBe('en');
    expect(json.recap).toEqual(englishRecap);
    expect(json.localized).toBe(false);
  });

  it('honors explicit ?locale= for participants (D5)', async () => {
    mockSessionMaybeSingle.mockResolvedValueOnce({
      data: {
        summary_json: englishRecap,
        transcript_available: true,
        duration_seconds: 1800,
        completed_at: '2026-06-06T00:00:00Z',
      },
      error: null,
    });
    mockTranslationsSelect.mockResolvedValueOnce({
      data: [{ target_locale: 'es', summary_json: { ...englishRecap, session_summary: 'Spanish' } }],
      error: null,
    });

    const response = await GET(
      new Request('http://localhost?locale=es'),
      { params: Promise.resolve({ bookingId: 'booking-1' }) },
    );

    const json = await response.json();
    expect(json.locale).toBe('es');
    expect(json.recap.session_summary).toBe('Spanish');
  });

  it('sets translationPending when English exists but locale translation is missing', async () => {
    mockSessionMaybeSingle.mockResolvedValueOnce({
      data: {
        summary_json: englishRecap,
        transcript_available: true,
        duration_seconds: 1800,
        completed_at: '2026-06-06T00:00:00Z',
      },
      error: null,
    });
    mockTranslationsSelect.mockResolvedValueOnce({ data: [], error: null });

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId: 'booking-1' }),
    });

    const json = await response.json();
    expect(json.translationPending).toBe(true);
    expect(json.recap).toEqual(englishRecap);
    expect(json.localized).toBe(false);
  });

  it('sets translationFailed when failure audit exists (D18)', async () => {
    mockSessionMaybeSingle.mockResolvedValueOnce({
      data: {
        summary_json: englishRecap,
        transcript_available: true,
        duration_seconds: 1800,
        completed_at: '2026-06-06T00:00:00Z',
      },
      error: null,
    });
    mockTranslationsSelect.mockResolvedValueOnce({ data: [], error: null });
    mockAuditSelect.mockResolvedValueOnce({ data: [{ id: 'audit-1' }], error: null });

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId: 'booking-1' }),
    });

    const json = await response.json();
    expect(json.translationFailed).toBe(true);
    expect(json.translationPending).toBe(false);
  });

  it('returns 400 for invalid locale', async () => {
    mockSessionMaybeSingle.mockResolvedValueOnce({
      data: {
        summary_json: englishRecap,
        transcript_available: true,
        duration_seconds: 1800,
        completed_at: '2026-06-06T00:00:00Z',
      },
      error: null,
    });

    const response = await GET(
      new Request('http://localhost?locale=de'),
      { params: Promise.resolve({ bookingId: 'booking-1' }) },
    );

    expect(response.status).toBe(400);
  });

  it('returns recap when session synthesis exists', async () => {
    mockGetSession.mockResolvedValueOnce({
      userId: 'mentee-1',
      role: 'mentee',
    });
    mockUserMaybeSingle.mockResolvedValueOnce({
      data: { preferred_locale: 'en' },
      error: null,
    });

    mockSessionMaybeSingle.mockResolvedValueOnce({
      data: {
        summary_json: englishRecap,
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
    expect(json.recap).toEqual(englishRecap);
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
