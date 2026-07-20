import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BookingSessionView } from '@/lib/booking-access';

const mockGetBookingForSession = vi.hoisted(() => vi.fn());
const mockBuildAuthorizedDailyJoinUrl = vi.hoisted(() => vi.fn());

vi.mock('@/lib/booking-access', () => ({
  getBookingForSession: (...args: unknown[]) => mockGetBookingForSession(...args),
}));

vi.mock('@/lib/daily', () => ({
  buildAuthorizedDailyJoinUrl: (...args: unknown[]) => mockBuildAuthorizedDailyJoinUrl(...args),
}));

import { GET } from '@/app/api/session/[bookingId]/join-url/route';

const bookingId = '00000000-0000-4000-8000-000000000099';
const dailyRoomUrl = 'https://astrolink.daily.co/astrolink-test';
const scheduledAt = '2030-06-01T18:00:00.000Z';

function buildBooking(
  overrides: Partial<BookingSessionView> = {},
): BookingSessionView {
  return {
    id: bookingId,
    status: 'confirmed',
    gate: 'ready',
    sessionRole: 'mentor',
    viewerId: 'mentor-uuid',
    viewerName: 'Chris Sembroski',
    dailyRoomUrl,
    mentorName: 'Chris Sembroski',
    menteeName: 'Carlos Hernandez',
    mentorId: 'mentor-uuid',
    menteeId: 'mentee-uuid',
    menteePreferredLocale: 'en',
    captionsAvailable: false,
    showCaptionsForBuyer: false,
    e2eCaptionsStub: false,
    scheduledAt,
    durationMinutes: 30,
    briefing: null,
    ...overrides,
  };
}

describe('GET /api/session/[bookingId]/join-url', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBookingForSession.mockResolvedValue({
      booking: buildBooking(),
      forbidden: false,
    });
    mockBuildAuthorizedDailyJoinUrl.mockResolvedValue(
      'https://astrolink.daily.co/astrolink-test?t=daily-token',
    );
  });

  it('mints a fresh Daily join URL for a ready participant', async () => {
    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      joinUrl: 'https://astrolink.daily.co/astrolink-test?t=daily-token',
    });
    expect(mockGetBookingForSession).toHaveBeenCalledWith(bookingId);
    expect(mockBuildAuthorizedDailyJoinUrl).toHaveBeenCalledWith({
      roomUrl: dailyRoomUrl,
      userId: 'mentor-uuid',
      userName: 'Chris Sembroski',
      isOwner: true,
      scheduledAt,
      durationMinutes: 30,
    });
  });

  it('returns 401 when the booking lookup forbids access', async () => {
    mockGetBookingForSession.mockResolvedValueOnce({
      booking: null,
      forbidden: true,
    });

    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId }),
    });

    expect(res.status).toBe(401);
    expect(mockBuildAuthorizedDailyJoinUrl).not.toHaveBeenCalled();
  });

  it('returns 404 when the booking is missing', async () => {
    mockGetBookingForSession.mockResolvedValueOnce({
      booking: null,
      forbidden: false,
    });

    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId }),
    });

    expect(res.status).toBe(404);
    expect(mockBuildAuthorizedDailyJoinUrl).not.toHaveBeenCalled();
  });

  it('returns 400 when the booking is not ready for video', async () => {
    mockGetBookingForSession.mockResolvedValueOnce({
      booking: buildBooking({ gate: 'too_early' }),
      forbidden: false,
    });

    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId }),
    });

    expect(res.status).toBe(400);
    expect(mockBuildAuthorizedDailyJoinUrl).not.toHaveBeenCalled();
  });

  it('returns 400 when the ready booking has no Daily room URL', async () => {
    mockGetBookingForSession.mockResolvedValueOnce({
      booking: buildBooking({ dailyRoomUrl: null }),
      forbidden: false,
    });

    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId }),
    });

    expect(res.status).toBe(400);
    expect(mockBuildAuthorizedDailyJoinUrl).not.toHaveBeenCalled();
  });

  it('returns 502 when Daily token minting fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockBuildAuthorizedDailyJoinUrl.mockRejectedValueOnce(new Error('Daily meeting token failed'));

    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ bookingId }),
    });

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: 'Daily meeting token failed' });
    expect(errorSpy).toHaveBeenCalledWith('[session] meeting token mint failed', {
      bookingId,
      message: 'Daily meeting token failed',
    });
  });
});
