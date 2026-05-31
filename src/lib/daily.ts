import 'server-only';

import { randomBytes } from 'crypto';

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
