import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildDailyJoinUrl,
  createDailyRoomForBooking,
  createMeetingToken,
  dailyRoomNameForBooking,
  extractDailyRoomNameFromUrl,
  meetingTokenExpiryUnix,
  parseMeetingEndedEvent,
  roomExpiryUnix,
  verifyDailyWebhookSignature,
} from '@/lib/daily';

describe('Daily helpers', () => {
  describe('dailyRoomNameForBooking', () => {
    it('derives a stable room name from booking id', () => {
      const id = 'a0000001-0000-4000-8000-000000000001';
      expect(dailyRoomNameForBooking(id)).toBe('astrolink-a0000001000040008000');
    });
  });

  describe('extractDailyRoomNameFromUrl', () => {
    it('parses room name from Daily URL', () => {
      expect(extractDailyRoomNameFromUrl('https://astrolink.daily.co/astrolink-abc123')).toBe(
        'astrolink-abc123',
      );
    });

    it('returns null for invalid URL', () => {
      expect(extractDailyRoomNameFromUrl('not-a-url')).toBeNull();
    });
  });

  describe('buildDailyJoinUrl', () => {
    it('appends meeting token query param', () => {
      const url = buildDailyJoinUrl('https://astrolink.daily.co/room-1', 'tok_abc');
      expect(url).toBe('https://astrolink.daily.co/room-1?t=tok_abc');
    });
  });

  describe('roomExpiryUnix', () => {
    it('defaults to ~48h from now when no schedule', () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = roomExpiryUnix(null);
      expect(exp).toBeGreaterThanOrEqual(now + 60 * 60 * 47);
      expect(exp).toBeLessThanOrEqual(now + 60 * 60 * 49);
    });

    it('extends past scheduled_at when provided', () => {
      const scheduledAt = new Date(Date.now() + 60 * 60 * 24).toISOString();
      const exp = roomExpiryUnix(scheduledAt);
      const scheduledSec = Math.floor(new Date(scheduledAt).getTime() / 1000);
      expect(exp).toBeGreaterThanOrEqual(scheduledSec);
    });
  });

  describe('meetingTokenExpiryUnix', () => {
    it('caps token expiry at room expiry', () => {
      const now = Math.floor(Date.now() / 1000);
      const roomExp = now + 60;
      expect(meetingTokenExpiryUnix(roomExp)).toBe(roomExp);
    });
  });

  describe('verifyDailyWebhookSignature', () => {
    it('accepts a valid HMAC signature', () => {
      const secretBase64 = Buffer.from('astrolink-webhook-secret').toString('base64');
      const timestamp = '1710000000';
      const rawBody = JSON.stringify({ type: 'meeting.ended', payload: { room: 'astrolink-abc' } });
      const signature = createHmac('sha256', Buffer.from(secretBase64, 'base64'))
        .update(`${timestamp}.${rawBody}`)
        .digest('base64');

      expect(
        verifyDailyWebhookSignature({
          rawBody,
          signatureHeader: signature,
          timestampHeader: timestamp,
          hmacSecretBase64: secretBase64,
        }),
      ).toBe(true);
    });

    it('rejects missing headers', () => {
      expect(
        verifyDailyWebhookSignature({
          rawBody: '{}',
          signatureHeader: null,
          timestampHeader: '123',
          hmacSecretBase64: Buffer.from('x').toString('base64'),
        }),
      ).toBe(false);
    });

    it('rejects tampered body', () => {
      const secretBase64 = Buffer.from('secret').toString('base64');
      const timestamp = '1710000000';
      const signature = createHmac('sha256', Buffer.from(secretBase64, 'base64'))
        .update(`${timestamp}.{"type":"meeting.ended"}`)
        .digest('base64');

      expect(
        verifyDailyWebhookSignature({
          rawBody: '{"type":"meeting.started"}',
          signatureHeader: signature,
          timestampHeader: timestamp,
          hmacSecretBase64: secretBase64,
        }),
      ).toBe(false);
    });
  });

  describe('parseMeetingEndedEvent', () => {
    it('parses meeting.ended payload', () => {
      const parsed = parseMeetingEndedEvent({
        type: 'meeting.ended',
        payload: {
          room: 'astrolink-booking123',
          start_ts: 1000,
          end_ts: 1900,
          meeting_id: 'mtg-1',
        },
      });

      expect(parsed).toEqual({
        room: 'astrolink-booking123',
        start_ts: 1000,
        end_ts: 1900,
        meeting_id: 'mtg-1',
      });
    });

    it('returns null for other event types', () => {
      expect(parseMeetingEndedEvent({ type: 'meeting.started' })).toBeNull();
    });

    it('returns null when required fields are missing', () => {
      expect(
        parseMeetingEndedEvent({
          type: 'meeting.ended',
          payload: { room: 'only-room' },
        }),
      ).toBeNull();
    });
  });

  describe('createDailyRoomForBooking', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
      delete process.env.DAILY_API_KEY;
    });

    it('creates a private room with schedule-based exp', async () => {
      process.env.DAILY_API_KEY = 'test-key';
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ url: 'https://astrolink.daily.co/astrolink-test', name: 'astrolink-test' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const scheduledAt = new Date(Date.now() + 60 * 60 * 2).toISOString();
      const result = await createDailyRoomForBooking('booking-uuid', { scheduledAt });

      expect(result.roomUrl).toContain('astrolink-test');
      expect(fetchMock).toHaveBeenCalledOnce();
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(String(init.body)) as {
        properties: { privacy: string; exp: number };
      };
      expect(body.properties.privacy).toBe('private');
      expect(body.properties.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('createMeetingToken', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
      delete process.env.DAILY_API_KEY;
    });

    it('posts role-bound token properties to Daily', async () => {
      process.env.DAILY_API_KEY = 'test-key';
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'daily_meeting_token' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const token = await createMeetingToken({
        roomName: 'astrolink-abc',
        userId: 'user-1',
        userName: 'Carlos',
        isOwner: true,
        exp: 9999999999,
      });

      expect(token).toBe('daily_meeting_token');
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(String(init.body)) as {
        properties: {
          room_name: string;
          user_id: string;
          user_name: string;
          is_owner: boolean;
          exp: number;
        };
      };
      expect(body.properties).toMatchObject({
        room_name: 'astrolink-abc',
        user_id: 'user-1',
        user_name: 'Carlos',
        is_owner: true,
        exp: 9999999999,
      });
    });
  });
});
