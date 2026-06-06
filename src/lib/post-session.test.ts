import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockBookingMaybeSingle = vi.hoisted(() => vi.fn());
const mockBookingSingle = vi.hoisted(() => vi.fn());
const mockTranscriptMaybeSingle = vi.hoisted(() => vi.fn());
const mockBookingUpdate = vi.hoisted(() => vi.fn());
const mockSynthesizeSession = vi.hoisted(() => vi.fn());
const mockFetchVtt = vi.hoisted(() => vi.fn());
const mockPersistTranscript = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn(() => ({
            ilike: vi.fn(() => ({ maybeSingle: mockBookingMaybeSingle })),
            eq: vi.fn(() => ({ single: mockBookingSingle })),
          })),
          update: vi.fn(() => ({ eq: mockBookingUpdate })),
        };
      }
      if (table === 'session_transcripts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: mockTranscriptMaybeSingle })),
          })),
        };
      }
      if (table === 'users' || table === 'mentors') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({ data: [], error: null })),
            eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        })),
      };
    }),
  },
}));

vi.mock('@/lib/booking-payments', () => ({
  isDevSkippedPaymentIntent: vi.fn(() => true),
}));

vi.mock('@/lib/daily', () => ({
  isDailyTranscriptionEnabled: vi.fn(() => true),
}));

vi.mock('@/services/agents/session-agent', () => ({
  SessionAgent: vi.fn(() => ({
    synthesizeSession: mockSynthesizeSession,
  })),
}));

vi.mock('@/services/agents/payment-agent', () => ({
  PaymentAgent: vi.fn(),
}));

vi.mock('@/lib/transcript-translation/fetch-daily-transcript', () => ({
  fetchDailyTranscriptVtt: (...args: unknown[]) => mockFetchVtt(...args),
}));

vi.mock('@/lib/transcript-translation/persist-transcript', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/transcript-translation/persist-transcript')>();
  return {
    ...actual,
    persistSessionTranscript: (...args: unknown[]) => mockPersistTranscript(...args),
  };
});

import { isDailyTranscriptionEnabled } from '@/lib/daily';
import {
  assertBookingEligibleForPostSession,
  fulfillBookingAfterMeetingEnded,
  fulfillBookingAfterTranscriptError,
  fulfillBookingAfterTranscriptReady,
  maybeRunSynthesisGate,
} from '@/lib/post-session';

const bookingRow = {
  id: 'booking-1',
  status: 'confirmed',
  stripe_payment_intent_id: 'pi_dev_skip',
  daily_room_url: 'https://astrolink.daily.co/astrolink-booking1',
  mentee_id: 'mentee-1',
  mentor_id: 'mentor-1',
};

describe('assertBookingEligibleForPostSession', () => {
  it('allows confirmed and completed bookings', () => {
    expect(assertBookingEligibleForPostSession('confirmed')).toEqual({ eligible: true });
    expect(assertBookingEligibleForPostSession('completed')).toEqual({ eligible: true });
  });

  it('rejects cancelled and pending bookings', () => {
    expect(assertBookingEligibleForPostSession('cancelled')).toEqual({
      eligible: false,
      reason: 'invalid_booking_status',
      status: 'cancelled',
    });
  });
});

describe('fulfillBookingAfterMeetingEnded', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBookingUpdate.mockResolvedValue({ error: null });
    mockSynthesizeSession.mockResolvedValue({});
    vi.mocked(isDailyTranscriptionEnabled).mockReturnValue(true);
  });

  afterEach(() => {
    delete process.env.DAILY_API_KEY;
  });

  it('runs synthesis gate when booking already completed (17A)', async () => {
    mockBookingMaybeSingle.mockResolvedValueOnce({
      data: { ...bookingRow, status: 'completed' },
      error: null,
    });
    mockBookingSingle.mockResolvedValueOnce({ data: { status: 'completed' }, error: null });
    mockTranscriptMaybeSingle.mockResolvedValueOnce({
      data: { id: 't1', utterances_json: [{ id: 'u1', text: 'hello', startMs: 0, endMs: 1000 }] },
      error: null,
    });

    const result = await fulfillBookingAfterMeetingEnded({
      room: 'astrolink-booking1',
      start_ts: 1000,
      end_ts: 1900,
    });

    expect(result).toMatchObject({
      processed: true,
      bookingId: 'booking-1',
      alreadyProcessed: true,
      gateRan: true,
      synthesized: true,
    });
    expect(mockBookingUpdate).not.toHaveBeenCalled();
    expect(mockSynthesizeSession).toHaveBeenCalled();
  });

  it('waits for transcript when capture completes first', async () => {
    mockBookingMaybeSingle.mockResolvedValueOnce({ data: bookingRow, error: null });
    mockBookingSingle.mockResolvedValueOnce({ data: { status: 'completed' }, error: null });
    mockTranscriptMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await fulfillBookingAfterMeetingEnded({
      room: 'astrolink-booking1',
      start_ts: 1000,
      end_ts: 1900,
    });

    expect(result).toMatchObject({
      processed: true,
      gateWaiting: true,
      reason: 'transcript_pending',
    });
    expect(mockSynthesizeSession).not.toHaveBeenCalled();
  });
});

describe('fulfillBookingAfterTranscriptReady', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSynthesizeSession.mockResolvedValue({});
    process.env.DAILY_API_KEY = 'test-key';
    vi.mocked(isDailyTranscriptionEnabled).mockReturnValue(true);
  });

  afterEach(() => {
    delete process.env.DAILY_API_KEY;
  });

  it('skips Daily fetch when utterances already stored (19A)', async () => {
    mockBookingMaybeSingle.mockResolvedValueOnce({ data: bookingRow, error: null });
    const storedTranscript = {
      data: {
        id: 't1',
        utterances_json: [{ id: 'u1', text: 'stored', startMs: 0, endMs: 2000 }],
      },
      error: null,
    };
    mockTranscriptMaybeSingle
      .mockResolvedValueOnce(storedTranscript)
      .mockResolvedValueOnce(storedTranscript);
    mockBookingSingle.mockResolvedValue({ data: { status: 'completed' }, error: null });

    const result = await fulfillBookingAfterTranscriptReady({
      transcriptId: 'tx_1',
      roomName: 'astrolink-booking1',
      durationSeconds: 1200,
    });

    expect(result.transcriptFetchSkipped).toBe(true);
    expect(mockFetchVtt).not.toHaveBeenCalled();
    expect(mockPersistTranscript).not.toHaveBeenCalled();
  });

  it('rejects cancelled bookings (2A)', async () => {
    mockBookingMaybeSingle.mockResolvedValueOnce({
      data: { ...bookingRow, status: 'cancelled' },
      error: null,
    });

    const result = await fulfillBookingAfterTranscriptReady({
      transcriptId: 'tx_1',
      roomName: 'astrolink-booking1',
    });

    expect(result).toMatchObject({
      processed: false,
      reason: 'invalid_booking_status',
      status: 'cancelled',
    });
  });
});

describe('fulfillBookingAfterTranscriptError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPersistTranscript.mockResolvedValue({ created: true, upgraded: false });
    mockSynthesizeSession.mockResolvedValue({});
    vi.mocked(isDailyTranscriptionEnabled).mockReturnValue(true);
  });

  it('persists empty marker and runs fallback synthesis gate (1A)', async () => {
    mockBookingMaybeSingle.mockResolvedValueOnce({
      data: { ...bookingRow, status: 'completed' },
      error: null,
    });
    mockBookingSingle.mockResolvedValueOnce({ data: { status: 'completed' }, error: null });
    mockTranscriptMaybeSingle.mockResolvedValueOnce({
      data: { id: 't1', utterances_json: [] },
      error: null,
    });

    const result = await fulfillBookingAfterTranscriptError({
      roomName: 'astrolink-booking1',
      error: 'deepgram timeout',
    });

    expect(result).toMatchObject({
      processed: true,
      fallback: true,
      gateRan: true,
      synthesized: true,
    });
    expect(mockPersistTranscript).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: 'booking-1', utterances: [] }),
    );
  });
});

describe('maybeRunSynthesisGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSynthesizeSession.mockResolvedValue({});
    vi.mocked(isDailyTranscriptionEnabled).mockReturnValue(true);
  });

  it('waits when booking capture is not completed', async () => {
    mockBookingSingle.mockResolvedValueOnce({ data: { status: 'confirmed' }, error: null });

    const result = await maybeRunSynthesisGate({ bookingId: 'booking-1' });

    expect(result).toEqual({ gateWaiting: true, reason: 'capture_pending' });
  });
});
