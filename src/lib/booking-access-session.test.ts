import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockBookingSingle = vi.hoisted(() => vi.fn());
const mockBuildAuthorizedDailyJoinUrl = vi.hoisted(() => vi.fn());
const mockResolveSessionJoinPhase = vi.hoisted(() => vi.fn());
const mockIsDailyTranscriptionEnabled = vi.hoisted(() => vi.fn());
const mockIsE2eStubLlmEnabled = vi.hoisted(() => vi.fn());

vi.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/lib/daily', () => ({
  buildAuthorizedDailyJoinUrl: (...args: unknown[]) => mockBuildAuthorizedDailyJoinUrl(...args),
  isDailyTranscriptionEnabled: () => mockIsDailyTranscriptionEnabled(),
  resolveSessionJoinPhase: (...args: unknown[]) => mockResolveSessionJoinPhase(...args),
}));

vi.mock('@/lib/llm', () => ({
  isE2eStubLlmEnabled: () => mockIsE2eStubLlmEnabled(),
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

import { getBookingForSession } from '@/lib/booking-access';

const bookingId = '00000000-0000-4000-8000-000000000099';
const dailyRoomUrl = 'https://astrolink.daily.co/astrolink-test';
const scheduledAt = '2030-06-01T18:00:00.000Z';

describe('getBookingForSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      userId: 'mentee-uuid',
      role: 'mentee',
      fullName: 'Carlos Hernandez',
    });
    mockBookingSingle.mockResolvedValue({
      data: {
        id: bookingId,
        status: 'confirmed',
        daily_room_url: dailyRoomUrl,
        mentee_id: 'mentee-uuid',
        mentor_id: 'mentor-uuid',
        scheduled_at: scheduledAt,
        briefing_json: null,
        mentors: { full_name: 'Chris Sembroski' },
        users: { full_name: 'Carlos Hernandez', preferred_locale: 'pt-BR' },
      },
      error: null,
    });
    mockResolveSessionJoinPhase.mockReturnValue('ready');
    mockIsDailyTranscriptionEnabled.mockReturnValue(false);
    mockIsE2eStubLlmEnabled.mockReturnValue(false);
  });

  it('returns ready booking context without minting a Daily join token', async () => {
    const { booking, forbidden } = await getBookingForSession(bookingId);

    expect(forbidden).toBe(false);
    expect(booking).toEqual(
      expect.objectContaining({
        id: bookingId,
        gate: 'ready',
        sessionRole: 'mentee',
        viewerId: 'mentee-uuid',
        viewerName: 'Carlos Hernandez',
        dailyRoomUrl,
        mentorName: 'Chris Sembroski',
        menteeName: 'Carlos Hernandez',
        menteePreferredLocale: 'pt-BR',
      }),
    );
    expect(booking).not.toHaveProperty('dailyJoinUrl');
    expect(booking).not.toHaveProperty('tokenError');
    expect(mockBuildAuthorizedDailyJoinUrl).not.toHaveBeenCalled();
  });
});
