import { describe, expect, it } from 'vitest';

import {
  parseTranscriptionMessage,
  transcriptionDedupeKey,
} from '@/lib/transcript-translation/daily-transcription';

describe('parseTranscriptionMessage', () => {
  it('parses final Daily transcription payload (legacy shape)', () => {
    const utterance = parseTranscriptionMessage({
      text: '  Hello orbit  ',
      user_id: 'mentor-uuid',
      start_ts: 12.5,
      end_ts: 14.2,
      is_final: true,
      speech_id: 'speech-1',
    });

    expect(utterance).toEqual({
      id: 'speech-1',
      speakerId: 'mentor-uuid',
      speakerRole: 'unknown',
      startMs: 12500,
      endMs: 14200,
      text: 'Hello orbit',
      isFinal: true,
      detectedLocale: undefined,
    });
  });

  it('parses daily-js payload with participantId, Date timestamp, and rawResponse', () => {
    const timestamp = new Date('2026-06-11T12:00:01.500Z');
    const utterance = parseTranscriptionMessage({
      participantId: 'daily-sess-99',
      timestamp,
      rawResponse: {
        is_final: true,
        channel: {
          alternatives: [
            {
              transcript: 'Hola órbita',
              languages: ['es'],
            },
          ],
        },
      },
    });

    expect(utterance).toMatchObject({
      speakerId: 'daily-sess-99',
      text: 'Hola órbita',
      isFinal: true,
      detectedLocale: 'es',
      startMs: timestamp.getTime(),
    });
  });

  it('falls back to top-level text when rawResponse transcript is empty', () => {
    const utterance = parseTranscriptionMessage({
      participantId: 'p1',
      text: 'Fallback line',
      is_final: true,
      start_ts: 2,
    });
    expect(utterance?.text).toBe('Fallback line');
  });

  it('returns null for partial segments when requireFinal is true', () => {
    expect(
      parseTranscriptionMessage({ text: 'partial', is_final: false }, { requireFinal: true }),
    ).toBeNull();
    expect(
      parseTranscriptionMessage(
        {
          text: 'partial',
          rawResponse: { is_final: false, channel: { alternatives: [{ transcript: 'partial' }] } },
        },
        { requireFinal: true },
      ),
    ).toBeNull();
  });

  it('dedupe key is stable per speaker start and text', () => {
    const utterance = parseTranscriptionMessage({
      text: 'Stable line',
      user_id: 'u1',
      start_ts: 1,
      is_final: true,
    });
    expect(utterance).not.toBeNull();
    const key = transcriptionDedupeKey(utterance!);
    expect(key).toBe('u1:1000:Stable line');
  });
});
