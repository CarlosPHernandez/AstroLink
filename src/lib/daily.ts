import 'server-only';

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

interface DailyRoomResponse {
  url: string;
  name: string;
}

export async function createDailyRoomForBooking(bookingId: string): Promise<{
  roomUrl: string;
  menteeToken: string;
  mentorToken: string;
}> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  const roomName = `astrolink-${bookingId.replace(/-/g, '').slice(0, 20)}`;
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 48;

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
    menteeToken: randomBytes(16).toString('hex'),
    mentorToken: randomBytes(16).toString('hex'),
  };
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
