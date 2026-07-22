import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildDailyJoinUrl,
  canProvisionDailyRoom,
  createDailyRoomForBooking,
  createMeetingToken,
  dailyRoomNameForBooking,
  extractDailyRoomNameFromUrl,
  isDailyProvisionEnabled,
  isDailyTranscriptionEnabled,
  meetingTokenExpiryUnix,
  meetingTokenWindowUnix,
  parseMeetingEndedEvent,
  parseTranscriptReadyEvent,
  resolveCallDurationMinutes,
  resolveEjectAfterElapsedSeconds,
  resolveSessionJoinPhase,
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

  describe('isDailyProvisionEnabled', () => {
    afterEach(() => {
      delete process.env.DAILY_PROVISION_ENABLED;
    });

    it('is false unless explicitly true', () => {
      expect(isDailyProvisionEnabled()).toBe(false);
      process.env.DAILY_PROVISION_ENABLED = 'false';
      expect(isDailyProvisionEnabled()).toBe(false);
      process.env.DAILY_PROVISION_ENABLED = 'true';
      expect(isDailyProvisionEnabled()).toBe(true);
    });
  });

  describe('canProvisionDailyRoom', () => {
    afterEach(() => {
      delete process.env.DAILY_PROVISION_ENABLED;
      delete process.env.DAILY_API_KEY;
    });

    it('requires flag and API key', () => {
      expect(canProvisionDailyRoom()).toBe(false);
      process.env.DAILY_API_KEY = 'key';
      expect(canProvisionDailyRoom()).toBe(false);
      process.env.DAILY_PROVISION_ENABLED = 'true';
      expect(canProvisionDailyRoom()).toBe(true);
    });
  });

  describe('resolveCallDurationMinutes', () => {
    it('uses booked duration when present', () => {
      expect(resolveCallDurationMinutes(15)).toBe(15);
      expect(resolveCallDurationMinutes(45)).toBe(45);
      expect(resolveCallDurationMinutes(60)).toBe(60);
    });

    it('clamps to session duration steps', () => {
      expect(resolveCallDurationMinutes(20)).toBe(15);
      expect(resolveCallDurationMinutes(40)).toBe(45);
    });

    it('falls back to env max when duration missing', () => {
      expect(resolveCallDurationMinutes(null)).toBe(35);
      expect(resolveCallDurationMinutes(undefined)).toBe(35);
      expect(resolveEjectAfterElapsedSeconds(15)).toBe(15 * 60);
    });
  });

  describe('resolveSessionJoinPhase', () => {
    it('returns unscheduled when no schedule', () => {
      expect(resolveSessionJoinPhase(null, Date.now())).toBe('unscheduled');
    });

    it('returns too_early before scheduled start (default before=0)', () => {
      const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      expect(resolveSessionJoinPhase(scheduledAt, Date.now())).toBe('too_early');
    });

    it('returns too_early one minute before start when before window is 0', () => {
      const scheduledAt = new Date(Date.now() + 60 * 1000).toISOString();
      expect(resolveSessionJoinPhase(scheduledAt, Date.now())).toBe('too_early');
    });

    it('returns ready at or after scheduled start', () => {
      const scheduledAt = new Date(Date.now() - 30 * 1000).toISOString();
      expect(resolveSessionJoinPhase(scheduledAt, Date.now())).toBe('ready');
    });

    it('returns expired after default after-window when no duration', () => {
      const scheduledAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(resolveSessionJoinPhase(scheduledAt, Date.now())).toBe('expired');
    });

    it('returns ready when late but within booked duration', () => {
      const scheduledAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(
        resolveSessionJoinPhase(scheduledAt, Date.now(), { durationMinutes: 45 }),
      ).toBe('ready');
    });

    it('returns expired after booked duration', () => {
      const scheduledAt = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      expect(
        resolveSessionJoinPhase(scheduledAt, Date.now(), { durationMinutes: 15 }),
      ).toBe('expired');
    });
  });

  describe('meetingTokenWindowUnix', () => {
    it('returns nbf at scheduled start by default and eject from booked duration', () => {
      const scheduledAt = new Date('2030-06-01T18:00:00.000Z').toISOString();
      const scheduledSec = Math.floor(new Date(scheduledAt).getTime() / 1000);
      const window = meetingTokenWindowUnix(scheduledAt, { durationMinutes: 15 });
      expect(window).not.toBeNull();
      expect(window!.nbf).toBe(scheduledSec);
      expect(window!.exp).toBeGreaterThan(scheduledSec);
      expect(window!.ejectAfterElapsed).toBe(15 * 60);
    });

    it('falls back eject to env max when duration omitted', () => {
      const scheduledAt = new Date('2030-06-01T18:00:00.000Z').toISOString();
      const window = meetingTokenWindowUnix(scheduledAt);
      expect(window!.ejectAfterElapsed).toBe(35 * 60);
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
      const window = meetingTokenWindowUnix(scheduledAt);
      expect(window).not.toBeNull();
      expect(exp).toBeGreaterThanOrEqual(window!.exp);
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
      const result = await createDailyRoomForBooking('booking-uuid', {
        scheduledAt,
        durationMinutes: 45,
      });

      expect(result.roomUrl).toContain('astrolink-test');
      expect(fetchMock).toHaveBeenCalledOnce();
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(String(init.body)) as {
        privacy: string;
        properties: {
          exp: number;
          max_participants: number;
          enforce_unique_user_ids: boolean;
          eject_at_room_exp: boolean;
          eject_after_elapsed: number;
          enable_transcription_storage: boolean;
        };
      };
      expect(body.privacy).toBe('private');
      expect(body.properties.max_participants).toBe(2);
      expect(body.properties.enforce_unique_user_ids).toBe(true);
      expect(body.properties.eject_at_room_exp).toBe(true);
      expect(body.properties.eject_after_elapsed).toBe(45 * 60);
      expect(body.properties.enable_transcription_storage).toBe(true);
      expect(body.properties.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('isDailyTranscriptionEnabled', () => {
    afterEach(() => {
      delete process.env.DAILY_TRANSCRIPTION_ENABLED;
    });

    it('is false unless explicitly enabled', () => {
      expect(isDailyTranscriptionEnabled()).toBe(false);
      process.env.DAILY_TRANSCRIPTION_ENABLED = 'true';
      expect(isDailyTranscriptionEnabled()).toBe(true);
    });
  });

  describe('parseTranscriptReadyEvent', () => {
    it('parses transcript.ready-to-download payload', () => {
      const parsed = parseTranscriptReadyEvent({
        type: 'transcript.ready-to-download',
        payload: {
          id: 'transcript-123',
          room_name: 'astrolink-abc',
          duration: 1800,
          mtg_session_id: 'mtg-1',
          status: 't_finished',
        },
      });

      expect(parsed).toEqual({
        transcriptId: 'transcript-123',
        roomName: 'astrolink-abc',
        durationSeconds: 1800,
        meetingSessionId: 'mtg-1',
      });
    });
  });

  describe('createMeetingToken', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
      delete process.env.DAILY_API_KEY;
      delete process.env.DAILY_TRANSCRIPTION_ENABLED;
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
        nbf: 9999990000,
        ejectAfterElapsed: 2100,
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
          nbf: number;
          eject_at_token_exp: boolean;
          eject_after_elapsed: number;
        };
      };
      expect(body.properties).toMatchObject({
        room_name: 'astrolink-abc',
        user_id: 'user-1',
        user_name: 'Carlos',
        is_owner: true,
        exp: 9999999999,
        nbf: 9999990000,
        eject_at_token_exp: true,
        eject_after_elapsed: 2100,
      });
    });

    it('sets eject_after_elapsed without nbf (unscheduled / duration-only)', async () => {
      process.env.DAILY_API_KEY = 'test-key';
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'daily_meeting_token' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await createMeetingToken({
        roomName: 'astrolink-abc',
        userId: 'user-1',
        userName: 'Carlos',
        isOwner: false,
        exp: 9999999999,
        ejectAfterElapsed: 900,
      });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(String(init.body)) as {
        properties: {
          eject_after_elapsed?: number;
          nbf?: number;
          eject_at_token_exp?: boolean;
        };
      };
      expect(body.properties.eject_after_elapsed).toBe(900);
      expect(body.properties.nbf).toBeUndefined();
      expect(body.properties.eject_at_token_exp).toBeUndefined();
    });
  });
});

