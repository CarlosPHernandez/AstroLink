import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  resolveStoredTranscriptContent,
  utterancesFromJson,
} from '@/lib/transcript-translation/resolve-session-transcript-content';
import type { TranscriptUtterance } from '@/lib/transcript-translation/types';

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const sampleVtt = readFileSync(join(fixtureDir, '__fixtures__/sample.vtt'), 'utf8');

const sampleUtterance: TranscriptUtterance = {
  id: 'utt-1',
  speakerId: 'Chris',
  speakerRole: 'mentor',
  startMs: 0,
  endMs: 1000,
  text: 'Hello from stored JSON.',
  isFinal: true,
};

describe('utterancesFromJson', () => {
  it('returns empty for non-arrays', () => {
    expect(utterancesFromJson(null)).toEqual([]);
    expect(utterancesFromJson({} as never)).toEqual([]);
  });

  it('returns array utterances', () => {
    expect(utterancesFromJson([sampleUtterance] as never)).toHaveLength(1);
  });
});

describe('resolveStoredTranscriptContent', () => {
  it('prefers non-empty utterances_json over VTT', () => {
    const result = resolveStoredTranscriptContent({
      utterancesJson: [sampleUtterance] as never,
      vttText: sampleVtt,
    });
    expect(result).toMatchObject({
      status: 'ready',
      fromVttReparse: false,
    });
    if (result.status === 'ready') {
      expect(result.utterances[0]?.text).toBe('Hello from stored JSON.');
    }
  });

  it('re-parses VTT when utterances_json is empty', () => {
    const result = resolveStoredTranscriptContent({
      utterancesJson: [],
      vttText: sampleVtt,
    });
    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.fromVttReparse).toBe(true);
      expect(result.utterances.length).toBeGreaterThanOrEqual(3);
      expect(result.utterances[0]?.text).toMatch(/RPO corridor/i);
    }
  });

  it('returns empty with hasVtt when VTT does not parse to cues', () => {
    const result = resolveStoredTranscriptContent({
      utterancesJson: [],
      vttText: 'WEBVTT\n\nNOTE no cues\n',
    });
    expect(result).toEqual({ status: 'empty', hasVtt: true });
  });

  it('returns empty without VTT when both are empty', () => {
    expect(
      resolveStoredTranscriptContent({
        utterancesJson: [],
        vttText: null,
      }),
    ).toEqual({ status: 'empty', hasVtt: false });
  });

  it('returns not-ready empty for null json and blank VTT', () => {
    expect(
      resolveStoredTranscriptContent({
        utterancesJson: null,
        vttText: '   ',
      }),
    ).toEqual({ status: 'empty', hasVtt: false });
  });
});
