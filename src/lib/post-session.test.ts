import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockBookingMaybeSingle = vi.hoisted(() => vi.fn());
const mockBookingSingle = vi.hoisted(() => vi.fn());
const mockTranscriptMaybeSingle = vi.hoisted(() => vi.fn());
const mockBookingUpdate = vi.hoisted(() => vi.fn());
const mockSynthesizeSession = vi.hoisted(() => vi.fn());
const mockFetchVtt = vi.hoisted(() => vi.fn());
const mockPersistTranscript = vi.hoisted(() => vi.fn());
const mockTranslateSessionRecap = vi.hoisted(() => vi.fn());
const mockUsersLookup = vi.hoisted(() => vi.fn());
const mockSessionsMaybeSingle = vi.hoisted(() => vi.fn());
const mockAuditInsert = vi.hoisted(() => vi.fn());

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
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({ data: [], error: null })),
            eq: vi.fn(() => ({
              maybeSingle: mockUsersLookup,
              single: mockUsersLookup,
            })),
          })),
        };
      }
      if (table === 'mentors') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({ data: [], error: null })),
            eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })),
          })),
        };
      }
      if (table === 'sessions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: mockSessionsMaybeSingle })),
          })),
        };
      }
      if (table === 'audit_log') {
        return { insert: mockAuditInsert };
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

vi.mock('@/services/agents/settlement-agent', () => ({
  SettlementAgent: vi.fn(() => ({
    settleFromFacts: vi.fn().mockResolvedValue({ skipped: false, decision: 'completed' }),
  })),
}));

vi.mock('@/services/agents/translation-agent', () => ({
  TranslationAgent: vi.fn(() => ({
    translateSessionRecap: mockTranslateSessionRecap,
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
  maybeRunTranslationIfNeeded,
} from '@/lib/post-session';

const bookingRow = {
  id: 'booking-1',
  status: 'confirmed',
  stripe_payment_intent_id: 'pi_dev_skip',
  daily_room_url: 'https://astrolink.daily.co/astrolink-booking1',
  mentee_id: 'mentee-1',
  mentor_id: 'mentor-1',
  duration_minutes: 45,
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

  it('waits for transcript when booking is already completed (immediate capture)', async () => {
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

    expect(result.processed).toBe(true);
    expect('transcriptFetchSkipped' in result && result.transcriptFetchSkipped).toBe(true);
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

  it('propagates fetch/persist failures (durable-first 500 path)', async () => {
    mockBookingMaybeSingle.mockResolvedValueOnce({ data: bookingRow, error: null });
    mockTranscriptMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockFetchVtt.mockRejectedValueOnce(new Error('Daily transcript access-link failed: 404'));

    await expect(
      fulfillBookingAfterTranscriptReady({
        transcriptId: 'tx_1',
        roomName: 'astrolink-booking1',
      }),
    ).rejects.toThrow('Daily transcript access-link failed');
  });

  it('does not throw when synthesis fails after successful persist', async () => {
    const utterances = [
      {
        id: 'u1',
        text: 'Hi',
        startMs: 0,
        endMs: 1000,
        speakerId: 's1',
        speakerRole: 'mentor' as const,
        isFinal: true,
      },
    ];
    mockBookingMaybeSingle.mockResolvedValueOnce({
      data: { ...bookingRow, status: 'completed' },
      error: null,
    });
    // 1) existing check empty; 2) gate load after persist
    mockTranscriptMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: { id: 't1', utterances_json: utterances, vtt_text: 'WEBVTT' },
        error: null,
      });
    mockFetchVtt.mockResolvedValueOnce(
      'WEBVTT\n\n1\n00:00:00.000 --> 00:00:01.000\n<v Mentor>Hi',
    );
    mockPersistTranscript.mockResolvedValueOnce({ created: true, upgraded: false });
    // persistTranscriptForBooking booking load + gate booking status
    mockBookingSingle
      .mockResolvedValueOnce({
        data: { id: 'booking-1', mentee_id: 'mentee-1', mentor_id: 'mentor-1' },
        error: null,
      })
      .mockResolvedValueOnce({ data: { status: 'completed' }, error: null });
    mockSynthesizeSession.mockRejectedValueOnce(new Error('LLM timeout'));
    mockAuditInsert.mockResolvedValue({ error: null });

    const result = await fulfillBookingAfterTranscriptReady({
      transcriptId: 'tx_1',
      roomName: 'astrolink-booking1',
      durationSeconds: 120,
    });

    expect(result.processed).toBe(true);
    expect(result).toMatchObject({
      bookingId: 'booking-1',
      synthesisFailedAfterPersist: true,
    });
    expect(mockAuditInsert).toHaveBeenCalled();
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
    mockTranslateSessionRecap.mockResolvedValue({});
    mockBookingSingle.mockResolvedValue({ data: { mentee_id: 'mentee-1' }, error: null });
    mockUsersLookup.mockResolvedValue({ data: { preferred_locale: 'en' }, error: null });
    mockSessionsMaybeSingle.mockResolvedValue({ data: null, error: null });
    vi.mocked(isDailyTranscriptionEnabled).mockReturnValue(true);
  });

  it('waits when booking is not yet completed (post immediate-capture)', async () => {
    mockBookingSingle.mockResolvedValueOnce({ data: { status: 'confirmed' }, error: null });

    const result = await maybeRunSynthesisGate({ bookingId: 'booking-1' });

    expect(result).toEqual({ gateWaiting: true, reason: 'capture_pending' }); // capture_pending kept for gate semantics (booking not yet completed)
  });
});

describe('maybeRunTranslationIfNeeded', () => {
  const englishRecap = {
    session_summary: 'Summary',
    key_insights: ['one'],
    action_items: [],
    mentor_feedback_prompt: 'feedback',
    recommended_next_session: 'next',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTranslateSessionRecap.mockResolvedValue(englishRecap);
    mockAuditInsert.mockResolvedValue({ error: null });
    mockBookingSingle.mockResolvedValue({
      data: { mentee_id: 'mentee-1' },
      error: null,
    });
  });

  it('runs APX-06 when English summary exists and mentee prefers pt-BR (D8)', async () => {
    mockUsersLookup.mockResolvedValueOnce({
      data: { preferred_locale: 'pt-BR' },
      error: null,
    });
    mockSessionsMaybeSingle.mockResolvedValueOnce({
      data: { summary_json: englishRecap },
      error: null,
    });

    const result = await maybeRunTranslationIfNeeded('booking-1');

    expect(result).toEqual({ translationRan: true, targetLocale: 'pt-BR' });
    expect(mockTranslateSessionRecap).toHaveBeenCalledWith('booking-1', 'pt-BR');
  });

  it('skips when mentee locale is English', async () => {
    mockUsersLookup.mockResolvedValueOnce({
      data: { preferred_locale: 'en' },
      error: null,
    });

    const result = await maybeRunTranslationIfNeeded('booking-1');

    expect(result).toEqual({ translationSkipped: true, reason: 'locale_english' });
    expect(mockTranslateSessionRecap).not.toHaveBeenCalled();
  });

  it('writes RECAP_TRANSLATION_FAILED audit when translation throws', async () => {
    mockUsersLookup.mockResolvedValueOnce({
      data: { preferred_locale: 'pt-BR' },
      error: null,
    });
    mockSessionsMaybeSingle.mockResolvedValueOnce({
      data: { summary_json: englishRecap },
      error: null,
    });
    mockTranslateSessionRecap.mockRejectedValueOnce(new Error('LLM timeout'));

    const result = await maybeRunTranslationIfNeeded('booking-1');

    expect(result).toEqual({ translationFailed: true });
    expect(mockAuditInsert).toHaveBeenCalledWith({
      agent_id: 'APX-06',
      event: 'RECAP_TRANSLATION_FAILED',
      ref_id: 'booking-1',
      payload: { error: 'LLM timeout' },
    });
  });
});

describe('fulfillBookingAfterMeetingEnded transcription disabled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBookingUpdate.mockResolvedValue({ error: null });
    mockSynthesizeSession.mockResolvedValue({});
    mockTranslateSessionRecap.mockResolvedValue({});
    mockBookingSingle.mockResolvedValue({ data: { mentee_id: 'mentee-1' }, error: null });
    mockUsersLookup.mockResolvedValue({ data: { preferred_locale: 'pt-BR' }, error: null });
    mockSessionsMaybeSingle.mockResolvedValue({
      data: {
        summary_json: {
          session_summary: 'Summary',
          key_insights: [],
          action_items: [],
          mentor_feedback_prompt: 'f',
          recommended_next_session: 'n',
        },
      },
      error: null,
    });
    vi.mocked(isDailyTranscriptionEnabled).mockReturnValue(false);
  });

  it('does not invent a recap or translation when transcription is disabled', async () => {
    mockBookingMaybeSingle.mockResolvedValueOnce({ data: bookingRow, error: null });

    await fulfillBookingAfterMeetingEnded({
      room: 'astrolink-booking1',
      start_ts: 1000,
      end_ts: 1900,
    });

    expect(mockSynthesizeSession).not.toHaveBeenCalled();
    expect(mockTranslateSessionRecap).not.toHaveBeenCalled();
  });
});
