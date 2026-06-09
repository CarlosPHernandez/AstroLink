import { describe, expect, it } from 'vitest';

import {
  parseTranscriptionMessage,
  transcriptionDedupeKey,
} from '@/lib/transcript-translation/daily-transcription';

describe('parseTranscriptionMessage', () => {
  it('parses final Daily transcription payload', () => {
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
    });
  });

  it('returns null for partial segments when requireFinal is true', () => {
    expect(
      parseTranscriptionMessage({ text: 'partial', is_final: false }, { requireFinal: true }),
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
