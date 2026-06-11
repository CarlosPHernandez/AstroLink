import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockBookingMaybeSingle = vi.hoisted(() => vi.fn());
const mockTranscriptMaybeSingle = vi.hoisted(() => vi.fn());
const mockMentorMaybeSingle = vi.hoisted(() => vi.fn());
const mockMenteeMaybeSingle = vi.hoisted(() => vi.fn());

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
      if (table === 'session_transcripts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: mockTranscriptMaybeSingle })),
          })),
        };
      }
      if (table === 'mentors') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: mockMentorMaybeSingle })),
          })),
        };
      }
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: mockMenteeMaybeSingle })),
          })),
        };
      }
      return { select: vi.fn() };
    }),
  },
}));

import { GET } from '@/app/api/session/[bookingId]/transcript/route';

const bookingId = '00000000-0000-4000-8000-000000000099';

describe('GET /api/session/[bookingId]/transcript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    mockTranscriptMaybeSingle.mockResolvedValue({
      data: {
        source_locale: 'en',
        utterances_json: [
          {
            id: 'utt-1',
            speakerId: 'Chris Sembroski',
            speakerRole: 'unknown',
            startMs: 1000,
            endMs: 2000,
            text: 'Hello orbit',
            isFinal: true,
          },
        ],
      },
      error: null,
    });
    mockMentorMaybeSingle.mockResolvedValue({
      data: { full_name: 'Chris Sembroski' },
      error: null,
    });
    mockMenteeMaybeSingle.mockResolvedValue({
      data: { full_name: 'Carlos Hernandez' },
      error: null,
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-participant', async () => {
    mockGetSession.mockResolvedValueOnce({ userId: 'other', role: 'mentee' });
    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId }),
    });
    expect(res.status).toBe(403);
  });

  it('returns 404 when transcript row is missing', async () => {
    mockTranscriptMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId }),
    });
    expect(res.status).toBe(404);
  });

  it('returns speaker-mapped utterances for participant', async () => {
    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.utterances).toHaveLength(1);
    expect(body.utterances[0].speakerRole).toBe('mentor');
    expect(body.utterances[0].text).toBe('Hello orbit');
  });
});
