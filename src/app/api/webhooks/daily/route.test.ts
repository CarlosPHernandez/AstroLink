import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFulfillTranscriptReady = vi.hoisted(() => vi.fn());
const mockFulfillTranscriptError = vi.hoisted(() => vi.fn());
const mockFulfillMeetingEnded = vi.hoisted(() => vi.fn());

vi.mock('@/lib/post-session', () => ({
  fulfillBookingAfterTranscriptReady: (...args: unknown[]) => mockFulfillTranscriptReady(...args),
  fulfillBookingAfterTranscriptError: (...args: unknown[]) => mockFulfillTranscriptError(...args),
  fulfillBookingAfterMeetingEnded: (...args: unknown[]) => mockFulfillMeetingEnded(...args),
}));

import { POST } from '@/app/api/webhooks/daily/route';

function signBody(body: string, secretBase64: string, timestamp: string) {
  return createHmac('sha256', Buffer.from(secretBase64, 'base64'))
    .update(`${timestamp}.${body}`)
    .digest('base64');
}

describe('POST /api/webhooks/daily', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DAILY_WEBHOOK_HMAC = Buffer.from('test-secret').toString('base64');
    mockFulfillTranscriptReady.mockResolvedValue({ processed: true, bookingId: 'b1' });
    mockFulfillTranscriptError.mockResolvedValue({ processed: true, fallback: true });
    mockFulfillMeetingEnded.mockResolvedValue({ processed: true, bookingId: 'b1' });
  });

  afterEach(() => {
    delete process.env.DAILY_WEBHOOK_HMAC;
  });

  it('routes transcript.error to fallback handler', async () => {
    const body = JSON.stringify({
      type: 'transcript.error',
      payload: { room_name: 'astrolink-booking1', error: 'timeout' },
    });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = signBody(body, process.env.DAILY_WEBHOOK_HMAC!, timestamp);

    const response = await POST(
      new Request('http://localhost/api/webhooks/daily', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-webhook-signature': signature,
          'x-webhook-timestamp': timestamp,
        },
        body,
      }),
    );

    expect(response.status).toBe(200);
    expect(mockFulfillTranscriptError).toHaveBeenCalledWith({
      roomName: 'astrolink-booking1',
      error: 'timeout',
    });
    expect(mockFulfillMeetingEnded).not.toHaveBeenCalled();
  });

  it('returns 500 when DAILY_WEBHOOK_HMAC is missing', async () => {
    delete process.env.DAILY_WEBHOOK_HMAC;
    const response = await POST(
      new Request('http://localhost/api/webhooks/daily', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'meeting.ended' }),
      }),
    );
    expect(response.status).toBe(500);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain('DAILY_WEBHOOK_HMAC');
    expect(mockFulfillMeetingEnded).not.toHaveBeenCalled();
  });

  it('routes transcript.ready before meeting.ended', async () => {
    const body = JSON.stringify({
      type: 'transcript.ready-to-download',
      payload: { id: 'tx_1', room_name: 'astrolink-booking1' },
    });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = signBody(body, process.env.DAILY_WEBHOOK_HMAC!, timestamp);

    const response = await POST(
      new Request('http://localhost/api/webhooks/daily', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-webhook-signature': signature,
          'x-webhook-timestamp': timestamp,
        },
        body,
      }),
    );

    expect(response.status).toBe(200);
    expect(mockFulfillTranscriptReady).toHaveBeenCalled();
    expect(mockFulfillMeetingEnded).not.toHaveBeenCalled();
  });
});
