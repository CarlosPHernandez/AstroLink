import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { parseMeetingEndedEvent, verifyDailyWebhookSignature } from '@/lib/daily';

describe('Daily webhook helpers', () => {
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
});
