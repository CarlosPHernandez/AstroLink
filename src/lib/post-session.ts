import 'server-only';

import type { Json } from '@/lib/database.types';
import { isDevSkippedPaymentIntent } from '@/lib/booking-payments';
import {
  isDailyTranscriptionEnabled,
  type TranscriptErrorPayload,
  type TranscriptReadyPayload,
} from '@/lib/daily';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchDailyTranscriptVtt } from '@/lib/transcript-translation/fetch-daily-transcript';
import { mapSpeakersToRoles } from '@/lib/transcript-translation/map-speakers';
import { parseWebVtt } from '@/lib/transcript-translation/parse-webvtt';
import {
  countUtterancesFromJson,
  persistSessionTranscript,
} from '@/lib/transcript-translation/persist-transcript';
import { selectTranscriptWindow } from '@/lib/transcript-translation/token-budget';
import type { TranscriptUtterance } from '@/lib/transcript-translation/types';
import { PaymentAgent } from '@/services/agents/payment-agent';
import { SessionAgent } from '@/services/agents/session-agent';

export type MeetingEndedPayload = {
  room: string;
  start_ts: number;
  end_ts: number;
  meeting_id?: string;
};

type BookingRow = {
  id: string;
  status: string;
  stripe_payment_intent_id: string;
  daily_room_url: string | null;
  mentee_id: string;
  mentor_id: string;
};

type SessionTranscriptRow = {
  id: string;
  utterances_json: Json | null;
  vtt_text: string | null;
};

const ELIGIBLE_POST_SESSION_STATUSES = new Set(['confirmed', 'completed']);

export type PostSessionEligibility =
  | { eligible: true }
  | { eligible: false; reason: 'invalid_booking_status'; status: string };

export function assertBookingEligibleForPostSession(status: string): PostSessionEligibility {
  if (ELIGIBLE_POST_SESSION_STATUSES.has(status)) {
    return { eligible: true };
  }
  return { eligible: false, reason: 'invalid_booking_status', status };
}

async function findBookingByDailyRoom(roomName: string): Promise<BookingRow | null> {
  const normalizedRoom = roomName.trim();
  if (!normalizedRoom) {
    return null;
  }

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('id, status, stripe_payment_intent_id, daily_room_url, mentee_id, mentor_id')
    .ilike('daily_room_url', `%/${normalizedRoom}`)
    .maybeSingle();

  if (error) {
    throw new Error(`Booking lookup failed: ${error.message}`);
  }

  return booking;
}

async function loadParticipantNames(mentorId: string, menteeId: string): Promise<{
  mentorDisplayName: string | null;
  menteeDisplayName: string | null;
}> {
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, full_name')
    .in('id', [mentorId, menteeId]);

  if (error) {
    throw new Error(`Participant lookup failed: ${error.message}`);
  }

  const mentor = users?.find((user) => user.id === mentorId);
  const mentee = users?.find((user) => user.id === menteeId);

  let mentorDisplayName = mentor?.full_name ?? null;
  if (!mentorDisplayName) {
    const { data: mentorRow, error: mentorError } = await supabaseAdmin
      .from('mentors')
      .select('full_name')
      .eq('id', mentorId)
      .maybeSingle();
    if (mentorError) {
      throw new Error(`Mentor lookup failed: ${mentorError.message}`);
    }
    mentorDisplayName = mentorRow?.full_name ?? null;
  }

  return {
    mentorDisplayName,
    menteeDisplayName: mentee?.full_name ?? null,
  };
}

async function loadSessionTranscript(bookingId: string): Promise<SessionTranscriptRow | null> {
  const { data, error } = await supabaseAdmin
    .from('session_transcripts')
    .select('id, utterances_json, vtt_text')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error) {
    throw new Error(`session_transcripts lookup failed: ${error.message}`);
  }

  return data;
}

function utterancesFromJson(value: Json | null): TranscriptUtterance[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as unknown as TranscriptUtterance[];
}

function durationMinutesFromUtterances(
  utterances: TranscriptUtterance[],
  fallback?: number,
): number {
  if (fallback !== undefined) {
    return Math.max(1, fallback);
  }
  const lastEndMs = utterances[utterances.length - 1]?.endMs ?? 0;
  return Math.max(1, Math.round(lastEndMs / 60_000) || 1);
}

async function captureOrCompleteBooking(booking: BookingRow) {
  if (!isDevSkippedPaymentIntent(booking.stripe_payment_intent_id)) {
    const paymentAgent = new PaymentAgent();
    await paymentAgent.captureEscrowPayment(booking.id, booking.stripe_payment_intent_id);
    return;
  }

  await supabaseAdmin.from('bookings').update({ status: 'completed' }).eq('id', booking.id);
}

async function runSessionSynthesisIfNeeded(params: {
  bookingId: string;
  transcriptText: string;
  durationMinutes: number;
}) {
  const sessionAgent = new SessionAgent();
  await sessionAgent.synthesizeSession(
    params.bookingId,
    params.transcriptText,
    params.durationMinutes,
  );

  return { synthesized: true };
}

/**
 * Dual-trigger gate (15A): runs APX-03 when capture is done and transcript is resolved.
 */
export async function maybeRunSynthesisGate(params: {
  bookingId: string;
  durationMinutes?: number;
}) {
  if (!isDailyTranscriptionEnabled()) {
    return { gateSkipped: true as const, reason: 'transcription_disabled' as const };
  }

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('status')
    .eq('id', params.bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error(`Booking not found for synthesis gate: ${params.bookingId}`);
  }

  if (booking.status !== 'completed') {
    return { gateWaiting: true as const, reason: 'capture_pending' as const };
  }

  const transcriptRow = await loadSessionTranscript(params.bookingId);
  if (!transcriptRow) {
    return { gateWaiting: true as const, reason: 'transcript_pending' as const };
  }

  const utterances = utterancesFromJson(transcriptRow.utterances_json);
  const window = selectTranscriptWindow(utterances);
  const durationMinutes = durationMinutesFromUtterances(utterances, params.durationMinutes);

  const synthesis = await runSessionSynthesisIfNeeded({
    bookingId: params.bookingId,
    transcriptText: window.text,
    durationMinutes,
  });

  return {
    gateRan: true as const,
    utteranceCount: utterances.length,
    transcriptTruncated: window.truncated,
    ...synthesis,
  };
}

/**
 * Persist Daily WebVTT without running APX-03 (8A).
 */
export async function persistTranscriptForBooking(params: {
  bookingId: string;
  vttText: string;
  dailyTranscriptId?: string | null;
  durationMinutes?: number;
}) {
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('id, mentee_id, mentor_id')
    .eq('id', params.bookingId)
    .single();

  if (error || !booking) {
    throw new Error(`Booking not found: ${params.bookingId}`);
  }

  const names = await loadParticipantNames(booking.mentor_id, booking.mentee_id);

  const parsed = parseWebVtt(params.vttText);
  const utterances = mapSpeakersToRoles(parsed, {
    mentorUserId: booking.mentor_id,
    menteeUserId: booking.mentee_id,
    mentorDisplayName: names.mentorDisplayName,
    menteeDisplayName: names.menteeDisplayName,
  });

  const persistResult = await persistSessionTranscript({
    bookingId: params.bookingId,
    vttText: params.vttText,
    utterances,
    dailyTranscriptId: params.dailyTranscriptId,
  });

  return {
    transcriptPersisted: persistResult.created,
    transcriptUpgraded: persistResult.upgraded,
    transcriptAlreadyStored: !persistResult.created && !persistResult.upgraded,
    utteranceCount: utterances.length,
    durationMinutes: durationMinutesFromUtterances(utterances, params.durationMinutes),
  };
}

/** Dev helper: persist + synthesis gate in one call. */
export async function ingestTranscriptVttForBooking(params: {
  bookingId: string;
  vttText: string;
  dailyTranscriptId?: string | null;
  durationMinutes?: number;
}) {
  const persist = await persistTranscriptForBooking(params);
  const gate = await maybeRunSynthesisGate({
    bookingId: params.bookingId,
    durationMinutes: persist.durationMinutes,
  });

  return {
    ...persist,
    ...gate,
  };
}

/**
 * Idempotent D1 fulfillment after Daily reports meeting.ended:
 * escrow capture (always). APX-03 runs here only when transcription is disabled.
 */
export async function fulfillBookingAfterMeetingEnded(payload: MeetingEndedPayload) {
  const roomName = payload.room.trim();
  if (!roomName) {
    throw new Error('Daily meeting.ended missing room name');
  }

  const booking = await findBookingByDailyRoom(roomName);
  if (!booking) {
    return { processed: false, reason: 'booking_not_found' as const };
  }

  const eligibility = assertBookingEligibleForPostSession(booking.status);
  if (!eligibility.eligible) {
    return {
      processed: false,
      bookingId: booking.id,
      reason: eligibility.reason,
      status: eligibility.status,
    };
  }

  const durationMinutes = Math.max(
    1,
    Math.round((payload.end_ts - payload.start_ts) / 60) || 1,
  );

  const alreadyCompleted = booking.status === 'completed';

  if (!alreadyCompleted) {
    if (!isDailyTranscriptionEnabled()) {
      await runSessionSynthesisIfNeeded({
        bookingId: booking.id,
        transcriptText: '',
        durationMinutes,
      });
    }

    await captureOrCompleteBooking(booking);
  }

  const gateResult = isDailyTranscriptionEnabled()
    ? await maybeRunSynthesisGate({ bookingId: booking.id, durationMinutes })
    : null;

  return {
    processed: true,
    bookingId: booking.id,
    alreadyProcessed: alreadyCompleted,
    transcriptionDeferred: isDailyTranscriptionEnabled(),
    ...(gateResult ?? {}),
  };
}

/**
 * D3 Phase 1: fetch Daily WebVTT, persist session_transcripts, then synthesis gate.
 */
export async function fulfillBookingAfterTranscriptReady(payload: TranscriptReadyPayload) {
  const booking = await findBookingByDailyRoom(payload.roomName);
  if (!booking) {
    return { processed: false, reason: 'booking_not_found' as const };
  }

  const eligibility = assertBookingEligibleForPostSession(booking.status);
  if (!eligibility.eligible) {
    return {
      processed: false,
      bookingId: booking.id,
      reason: eligibility.reason,
      status: eligibility.status,
    };
  }

  const durationMinutes = payload.durationSeconds
    ? Math.max(1, Math.round(payload.durationSeconds / 60))
    : undefined;

  const existing = await loadSessionTranscript(booking.id);
  if (existing && countUtterancesFromJson(existing.utterances_json) > 0) {
    const gate = await maybeRunSynthesisGate({
      bookingId: booking.id,
      durationMinutes,
    });

    return {
      processed: true,
      bookingId: booking.id,
      transcriptFetchSkipped: true,
      transcriptAlreadyStored: true,
      ...gate,
    };
  }

  const apiKey = process.env.DAILY_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  const vttText = await fetchDailyTranscriptVtt(payload.transcriptId, apiKey);
  const persist = await persistTranscriptForBooking({
    bookingId: booking.id,
    vttText,
    dailyTranscriptId: payload.transcriptId,
    durationMinutes,
  });

  const gate = await maybeRunSynthesisGate({
    bookingId: booking.id,
    durationMinutes: persist.durationMinutes,
  });

  return {
    processed: true,
    bookingId: booking.id,
    ...persist,
    ...gate,
  };
}

/**
 * transcript.error fallback (1A): persist empty marker and run synthesis gate when capture is done.
 */
export async function fulfillBookingAfterTranscriptError(payload: TranscriptErrorPayload) {
  const roomName = payload.roomName?.trim();
  if (!roomName) {
    return { processed: false, reason: 'missing_room' as const };
  }

  const booking = await findBookingByDailyRoom(roomName);
  if (!booking) {
    return { processed: false, reason: 'booking_not_found' as const };
  }

  const eligibility = assertBookingEligibleForPostSession(booking.status);
  if (!eligibility.eligible) {
    return {
      processed: false,
      bookingId: booking.id,
      reason: eligibility.reason,
      status: eligibility.status,
    };
  }

  await persistSessionTranscript({
    bookingId: booking.id,
    vttText: '',
    utterances: [],
    dailyTranscriptId: null,
  });

  const gate = await maybeRunSynthesisGate({ bookingId: booking.id });

  return {
    processed: true,
    bookingId: booking.id,
    fallback: true,
    error: payload.error,
    ...gate,
  };
}
