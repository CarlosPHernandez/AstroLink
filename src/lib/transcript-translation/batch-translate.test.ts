import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/llm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/llm')>();
  return {
    ...actual,
    callLlmWithBackoff: vi.fn((fn: () => Promise<string>) => fn()),
    generatePlainText: vi.fn(actual.generatePlainText),
  };
});

import { generatePlainText } from '@/lib/llm';
import {
  chunkUtterances,
  clearTranscriptTranslationCache,
  getCachedTranscriptTranslation,
  setCachedTranscriptTranslation,
  translateTranscriptUtterances,
} from '@/lib/transcript-translation/batch-translate';
import type { TranscriptUtterance } from '@/lib/transcript-translation/types';

function utterance(id: string, text: string): TranscriptUtterance {
  return {
    id,
    speakerId: 'mentor-uuid',
    speakerRole: 'mentor',
    startMs: 0,
    endMs: 1000,
    text,
    isFinal: true,
  };
}

describe('chunkUtterances', () => {
  it('chunks ~20 utterances per batch', () => {
    const items = Array.from({ length: 45 }, (_, i) => i);
    const chunks = chunkUtterances(items, 20);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(20);
    expect(chunks[2]).toHaveLength(5);
  });
});

describe('transcript translation cache', () => {
  beforeEach(() => {
    clearTranscriptTranslationCache();
  });

  it('returns cache hit on second toggle', () => {
    const translated = [utterance('u1', '[es] Hello')];
    setCachedTranscriptTranslation('booking-1', 'es', translated);
    expect(getCachedTranscriptTranslation('booking-1', 'es')).toEqual(translated);
  });
});

describe('translateTranscriptUtterances', () => {
  beforeEach(() => {
    clearTranscriptTranslationCache();
    vi.mocked(generatePlainText).mockReset();
    process.env.E2E_STUB_LLM = 'false';
  });

  afterEach(() => {
    delete process.env.E2E_STUB_LLM;
  });

  it('keeps source lines when a chunk translation fails', async () => {
    vi.mocked(generatePlainText)
      .mockResolvedValueOnce('1. [es] Line one\n2. [es] Line two')
      .mockRejectedValueOnce(new Error('LLM down'));

    const input = [utterance('u1', 'Line one'), utterance('u2', 'Line two'), utterance('u3', 'Line three')];
    const chunks = chunkUtterances(input, 2);
    expect(chunks).toHaveLength(2);

    const result = await translateTranscriptUtterances({
      bookingId: 'booking-1',
      utterances: input,
      sourceLocale: 'en',
      targetLocale: 'es',
      rateLimitKey: 'mentee-uuid',
    });

    expect(result[0]?.text).toContain('Line one');
    expect(result[2]?.text).toBe('Line three');
  });
});
