import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';

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
const SCHEDULED_WINDOW_AFTER_SEC = 60 * 60 * 4;

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

/** Room `exp` unix timestamp: scheduled end + buffer, or 48h from now. */
export function roomExpiryUnix(scheduledAt?: string | null): number {
  const nowSec = Math.floor(Date.now() / 1000);
  if (!scheduledAt) {
    return nowSec + DEFAULT_ROOM_TTL_SEC;
  }
  const scheduledMs = new Date(scheduledAt).getTime();
  if (Number.isNaN(scheduledMs)) {
    return nowSec + DEFAULT_ROOM_TTL_SEC;
  }
  const windowEndSec = Math.floor((scheduledMs + SCHEDULED_WINDOW_AFTER_SEC * 1000) / 1000);
  return Math.max(nowSec + 60 * 60 * 2, windowEndSec);
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
  options?: { scheduledAt?: string | null },
): Promise<{ roomUrl: string; roomName: string }> {
  const apiKey = getDailyApiKey();
  const roomName = dailyRoomNameForBooking(bookingId);
  const exp = roomExpiryUnix(options?.scheduledAt);

  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: roomName,
      properties: {
        exp,
        privacy: 'private',
        enable_chat: true,
        start_video_off: false,
        start_audio_off: false,
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
}): Promise<string> {
  const apiKey = getDailyApiKey();
  const exp = params.exp ?? meetingTokenExpiryUnix();

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
    .select('id, daily_room_url, scheduled_at')
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

  const daily = await createDailyRoomForBooking(bookingId, {
    scheduledAt: booking.scheduled_at,
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
}): Promise<string> {
  const roomName = extractDailyRoomNameFromUrl(params.roomUrl);
  if (!roomName) {
    throw new Error('Invalid Daily room URL');
  }

  const token = await createMeetingToken({
    roomName,
    userId: params.userId,
    userName: params.userName,
    isOwner: params.isOwner,
  });

  return buildDailyJoinUrl(params.roomUrl, token);
}

/** Daily meeting.ended webhook envelope (subset used by AstroLink). */
export type DailyWebhookEvent = {
  type: string;
  payload?: {
    type?: string;
    room?: string;
    start_ts?: number;
    end_ts?: number;
    meeting_id?: string;
  };
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
