import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';

import {
  clampSessionDurationMinutes,
  SESSION_DURATION_DEFAULT,
  SESSION_DURATION_MAX,
} from '@/lib/session-duration';
import { supabaseAdmin } from '@/lib/supabase';

interface DailyRoomResponse {
  url: string;
  name: string;
}

interface DailyMeetingTokenResponse {
  token: string;
}

const DEFAULT_ROOM_TTL_SEC = 60 * 60 * 48;
const MEETING_TOKEN_TTL_SEC = 60 * 60 * 4;

/** Safety ceiling if a booking row has a bad duration; still caps Chris 60-min max. */
const EJECT_DURATION_HARD_CAP_MINUTES = SESSION_DURATION_MAX;

export type SessionJoinPhase = 'too_early' | 'ready' | 'expired' | 'unscheduled';

function parseDailyEnvInt(value: string | undefined, fallback: number): number {
  if (!value?.trim()) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Allows 0 (e.g. join window opens at scheduled start). */
function parseDailyEnvNonNegativeInt(value: string | undefined, fallback: number): number {
  if (!value?.trim()) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getDailyDemoConfig() {
  return {
    maxParticipants: parseDailyEnvInt(process.env.DAILY_MAX_PARTICIPANTS, 2),
    // Default 0: room opens at scheduled start (not early). Override via env if needed.
    joinWindowBeforeMinutes: parseDailyEnvNonNegativeInt(
      process.env.DAILY_ROOM_JOIN_WINDOW_BEFORE_MINUTES,
      0,
    ),
    joinWindowAfterMinutes: parseDailyEnvInt(process.env.DAILY_ROOM_JOIN_WINDOW_AFTER_MINUTES, 60),
    /** Fallback only when booking has no duration_minutes. */
    maxCallMinutes: parseDailyEnvInt(process.env.DAILY_MAX_CALL_MINUTES, 35),
  };
}

/**
 * Call hard-end length in minutes: prefers the booked duration, else env fallback.
 * Used for Daily `eject_after_elapsed` so a 15-min booking ends at 15, Chris 45 at 45, etc.
 */
export function resolveCallDurationMinutes(
  durationMinutes?: number | null,
  fallbackMinutes?: number,
): number {
  const cfgFallback = fallbackMinutes ?? getDailyDemoConfig().maxCallMinutes;
  if (durationMinutes == null || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return Math.min(Math.max(1, Math.floor(cfgFallback)), EJECT_DURATION_HARD_CAP_MINUTES);
  }
  const clamped = clampSessionDurationMinutes(durationMinutes);
  return Math.min(clamped, EJECT_DURATION_HARD_CAP_MINUTES);
}

export function resolveEjectAfterElapsedSeconds(durationMinutes?: number | null): number {
  return resolveCallDurationMinutes(durationMinutes) * 60;
}

/** Explicit opt-in — production/demo must set DAILY_PROVISION_ENABLED=true. */
export function isDailyProvisionEnabled(): boolean {
  const flag = process.env.DAILY_PROVISION_ENABLED?.trim().toLowerCase();
  return flag === 'true';
}

/** When true, APX-03 runs on transcript.ready-to-download instead of meeting.ended. */
export function isDailyTranscriptionEnabled(): boolean {
  const flag = process.env.DAILY_TRANSCRIPTION_ENABLED?.trim().toLowerCase();
  return flag === 'true';
}

export function canProvisionDailyRoom(): boolean {
  return isDailyProvisionEnabled() && Boolean(process.env.DAILY_API_KEY?.trim());
}

export function dailyRoomNameForBooking(bookingId: string): string {
  return `astrolink-${bookingId.replace(/-/g, '').slice(0, 20)}`;
}

export function extractDailyRoomNameFromUrl(roomUrl: string): string | null {
  try {
    const name = new URL(roomUrl).pathname.replace(/^\//, '').trim();
    return name || null;
  } catch {
    return null;
  }
}

export function meetingTokenWindowUnix(
  scheduledAt: string | null | undefined,
  options?: { durationMinutes?: number | null },
): {
  nbf: number;
  exp: number;
  ejectAfterElapsed: number;
} | null {
  if (!scheduledAt?.trim()) {
    return null;
  }
  const scheduledMs = new Date(scheduledAt).getTime();
  if (Number.isNaN(scheduledMs)) {
    return null;
  }

  const cfg = getDailyDemoConfig();
  const nbf = Math.floor((scheduledMs - cfg.joinWindowBeforeMinutes * 60_000) / 1000);
  const exp = Math.floor((scheduledMs + cfg.joinWindowAfterMinutes * 60_000) / 1000);

  return {
    nbf,
    exp,
    ejectAfterElapsed: resolveEjectAfterElapsedSeconds(options?.durationMinutes),
  };
}

export function resolveSessionJoinPhase(
  scheduledAt: string | null | undefined,
  nowMs: number = Date.now(),
): SessionJoinPhase {
  if (!scheduledAt?.trim()) {
    return 'unscheduled';
  }
  const scheduledMs = new Date(scheduledAt).getTime();
  if (Number.isNaN(scheduledMs)) {
    return 'unscheduled';
  }

  const cfg = getDailyDemoConfig();
  const windowStart = scheduledMs - cfg.joinWindowBeforeMinutes * 60_000;
  const windowEnd = scheduledMs + cfg.joinWindowAfterMinutes * 60_000;

  if (nowMs < windowStart) {
    return 'too_early';
  }
  if (nowMs > windowEnd) {
    return 'expired';
  }
  return 'ready';
}

/** Room `exp` unix timestamp: join-window end when scheduled, else 48h from now. */
export function roomExpiryUnix(
  scheduledAt?: string | null,
  options?: { durationMinutes?: number | null },
): number {
  const nowSec = Math.floor(Date.now() / 1000);
  const window = meetingTokenWindowUnix(scheduledAt, options);
  if (window) {
    return Math.max(nowSec + 60 * 60 * 2, window.exp);
  }
  return nowSec + DEFAULT_ROOM_TTL_SEC;
}

export function meetingTokenExpiryUnix(roomExp?: number): number {
  const nowSec = Math.floor(Date.now() / 1000);
  const tokenExp = nowSec + MEETING_TOKEN_TTL_SEC;
  if (roomExp != null) {
    return Math.min(tokenExp, roomExp);
  }
  return tokenExp;
}

export function buildDailyJoinUrl(roomUrl: string, token: string): string {
  const url = new URL(roomUrl);
  url.searchParams.set('t', token);
  return url.toString();
}

function getDailyApiKey(): string {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    throw new Error('DAILY_API_KEY is not configured');
  }
  return apiKey;
}

export async function createDailyRoomForBooking(
  bookingId: string,
  options?: { scheduledAt?: string | null; durationMinutes?: number | null },
): Promise<{ roomUrl: string; roomName: string }> {
  const apiKey = getDailyApiKey();
  const roomName = dailyRoomNameForBooking(bookingId);
  const exp = roomExpiryUnix(options?.scheduledAt, {
    durationMinutes: options?.durationMinutes,
  });
  const cfg = getDailyDemoConfig();
  const ejectAfterElapsed = resolveEjectAfterElapsedSeconds(options?.durationMinutes);

  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: roomName,
      privacy: 'private',
      properties: {
        exp,
        enable_chat: true,
        start_video_off: false,
        start_audio_off: false,
        max_participants: cfg.maxParticipants,
        enforce_unique_user_ids: true,
        eject_at_room_exp: true,
        eject_after_elapsed: ejectAfterElapsed,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Daily room creation failed: ${response.status} ${body}`);
  }

  const room = (await response.json()) as DailyRoomResponse;

  return {
    roomUrl: room.url,
    roomName: room.name,
  };
}

export async function createMeetingToken(params: {
  roomName: string;
  userId: string;
  userName: string;
  isOwner: boolean;
  exp?: number;
  nbf?: number;
  ejectAfterElapsed?: number;
}): Promise<string> {
  const apiKey = getDailyApiKey();
  const exp = params.exp ?? meetingTokenExpiryUnix();
  const tokenWindow = params.nbf != null;

  const response = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        room_name: params.roomName,
        user_id: params.userId,
        user_name: params.userName,
        is_owner: params.isOwner,
        exp,
        // nbf gates early join; eject_after_elapsed must apply even when unscheduled
        // (no nbf) so booked duration still hard-ends the call.
        ...(tokenWindow
          ? {
              nbf: params.nbf,
              eject_at_token_exp: true,
            }
          : {}),
        ...(params.ejectAfterElapsed != null
          ? { eject_after_elapsed: params.ejectAfterElapsed }
          : {}),
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Daily meeting token failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as DailyMeetingTokenResponse;
  if (!data.token) {
    throw new Error('Daily meeting token response missing token');
  }

  return data.token;
}

/**
 * Idempotent: creates a private Daily room and persists URL on the booking.
 */
export async function provisionDailyRoomForBooking(bookingId: string): Promise<{
  roomUrl: string;
  roomName: string;
  created: boolean;
}> {
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('id, daily_room_url, scheduled_at, duration_minutes')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }

  if (booking.daily_room_url) {
    const roomName = extractDailyRoomNameFromUrl(booking.daily_room_url);
    if (roomName) {
      return {
        roomUrl: booking.daily_room_url,
        roomName,
        created: false,
      };
    }
  }

  if (!canProvisionDailyRoom()) {
    throw new Error('Daily room provisioning is disabled');
  }

  const daily = await createDailyRoomForBooking(bookingId, {
    scheduledAt: booking.scheduled_at,
    durationMinutes: booking.duration_minutes ?? SESSION_DURATION_DEFAULT,
  });

  const { error: updateError } = await supabaseAdmin
    .from('bookings')
    .update({
      daily_room_url: daily.roomUrl,
      mentee_token: null,
      mentor_token: null,
    })
    .eq('id', bookingId);

  if (updateError) {
    throw new Error(`Failed to save Daily room for booking ${bookingId}: ${updateError.message}`);
  }

  console.info('[daily] provisioned room', { bookingId, roomName: daily.roomName });

  return { roomUrl: daily.roomUrl, roomName: daily.roomName, created: true };
}

export async function buildAuthorizedDailyJoinUrl(params: {
  roomUrl: string;
  userId: string;
  userName: string;
  isOwner: boolean;
  scheduledAt?: string | null;
  /** Booked session length; drives Daily eject_after_elapsed. */
  durationMinutes?: number | null;
}): Promise<string> {
  const roomName = extractDailyRoomNameFromUrl(params.roomUrl);
  if (!roomName) {
    throw new Error('Invalid Daily room URL');
  }

  const durationOptions = { durationMinutes: params.durationMinutes };
  const window = meetingTokenWindowUnix(params.scheduledAt, durationOptions);
  const roomExp = roomExpiryUnix(params.scheduledAt, durationOptions);

  const token = await createMeetingToken({
    roomName,
    userId: params.userId,
    userName: params.userName,
    isOwner: params.isOwner,
    exp: window?.exp ?? meetingTokenExpiryUnix(roomExp),
    nbf: window?.nbf,
    ejectAfterElapsed:
      window?.ejectAfterElapsed ?? resolveEjectAfterElapsedSeconds(params.durationMinutes),
  });

  return buildDailyJoinUrl(params.roomUrl, token);
}

/** Daily webhook envelope (subset used by AstroLink). */
export type DailyWebhookEvent = {
  type: string;
  payload?: {
    type?: string;
    room?: string;
    room_name?: string;
    start_ts?: number;
    end_ts?: number;
    meeting_id?: string;
    id?: string;
    duration?: number;
    mtg_session_id?: string;
    status?: string;
    error?: string;
  };
};

export type TranscriptReadyPayload = {
  transcriptId: string;
  roomName: string;
  durationSeconds?: number;
  meetingSessionId?: string;
};

export type TranscriptErrorPayload = {
  roomName?: string;
  error?: string;
};

/**
 * Verifies Daily webhook HMAC (secret is base64-encoded per Daily dashboard).
 * @see https://docs.daily.co/reference/rest-api/webhooks
 */
export function verifyDailyWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  hmacSecretBase64: string;
}): boolean {
  const { rawBody, signatureHeader, timestampHeader, hmacSecretBase64 } = params;
  if (!signatureHeader || !timestampHeader) {
    return false;
  }

  const expected = createHmac('sha256', Buffer.from(hmacSecretBase64, 'base64'))
    .update(`${timestampHeader}.${rawBody}`)
    .digest('base64');

  const sigBuf = Buffer.from(signatureHeader);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) {
    return false;
  }

  return timingSafeEqual(sigBuf, expBuf);
}

export function parseMeetingEndedEvent(body: DailyWebhookEvent): {
  room: string;
  start_ts: number;
  end_ts: number;
  meeting_id?: string;
} | null {
  const eventType = body.type ?? body.payload?.type;
  if (eventType !== 'meeting.ended') {
    return null;
  }

  const inner = body.payload;
  if (!inner?.room || inner.start_ts == null || inner.end_ts == null) {
    return null;
  }

  return {
    room: inner.room,
    start_ts: inner.start_ts,
    end_ts: inner.end_ts,
    meeting_id: inner.meeting_id,
  };
}

export function parseTranscriptReadyEvent(body: DailyWebhookEvent): TranscriptReadyPayload | null {
  const eventType = body.type ?? body.payload?.type;
  if (eventType !== 'transcript.ready-to-download') {
    return null;
  }

  const inner = body.payload;
  if (!inner) {
    return null;
  }

  const transcriptId = inner.id?.trim();
  const roomName = inner.room_name?.trim();
  if (!transcriptId || !roomName) {
    return null;
  }

  return {
    transcriptId,
    roomName,
    durationSeconds: inner.duration,
    meetingSessionId: inner.mtg_session_id,
  };
}

export function parseTranscriptErrorEvent(body: DailyWebhookEvent): TranscriptErrorPayload | null {
  const eventType = body.type ?? body.payload?.type;
  if (eventType !== 'transcript.error') {
    return null;
  }

  return {
    roomName: body.payload?.room_name,
    error: body.payload?.error,
  };
}
