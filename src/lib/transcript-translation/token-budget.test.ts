import { describe, expect, it } from 'vitest';
import type { TranscriptUtterance } from '@/lib/transcript-translation/types';
import {
  estimateTranscriptTokens,
  selectTranscriptWindow,
  stripFillerForSynthesis,
} from '@/lib/transcript-translation/token-budget';

function utterance(
  id: string,
  startMs: number,
  endMs: number,
  text: string,
  speakerRole: TranscriptUtterance['speakerRole'] = 'mentor',
): TranscriptUtterance {
  return {
    id,
    speakerId: speakerRole,
    speakerRole,
    startMs,
    endMs,
    text,
    isFinal: true,
  };
}

describe('estimateTranscriptTokens', () => {
  it('returns 0 for empty text', () => {
    expect(estimateTranscriptTokens('')).toBe(0);
  });

  it('estimates ~4 chars per token', () => {
    expect(estimateTranscriptTokens('abcd')).toBe(1);
    expect(estimateTranscriptTokens('abcdefgh')).toBe(2);
  });
});

describe('stripFillerForSynthesis', () => {
  it('removes common fillers', () => {
    expect(stripFillerForSynthesis('um you know the RPO maneuver')).toBe('the RPO maneuver');
  });
});

describe('selectTranscriptWindow', () => {
  it('returns empty window for no utterances', () => {
    const result = selectTranscriptWindow([]);
    expect(result.text).toBe('');
    expect(result.truncated).toBe(false);
  });

  it('includes head and tail segments and respects max token cap', () => {
    const utterances: TranscriptUtterance[] = [
      utterance('h1', 0, 30_000, 'Opening objectives for the session.'),
      ...Array.from({ length: 20 }, (_, i) =>
        utterance(
          `m${i}`,
          600_000 + i * 60_000,
          630_000 + i * 60_000,
          `Middle segment ${i} with extended technical discussion on propulsion systems and launch vehicles.`,
        ),
      ),
      utterance('t1', 2_400_000, 2_430_000, 'Closing action items and next steps.'),
    ];

    const result = selectTranscriptWindow(utterances, { maxTokens: 50, headMinutes: 1, tailMinutes: 1 });

    expect(result.text).toContain('Opening objectives');
    expect(result.text).toContain('Closing action items');
    expect(result.estimatedTokens).toBeLessThanOrEqual(50);
    expect(result.truncated).toBe(true);
    expect(result.utteranceCount).toBeLessThan(utterances.length);
  });
});
