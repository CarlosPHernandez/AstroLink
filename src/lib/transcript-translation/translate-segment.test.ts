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
import { clearAllSegmentCaches } from '@/lib/transcript-translation/segment-cache';
import {
  translateSegment,
  TranslateSegmentError,
  validateTranslateSegmentInput,
} from '@/lib/transcript-translation/translate-segment';

const baseInput = {
  bookingId: '00000000-0000-4000-8000-000000000001',
  segmentId: 'seg-1',
  text: 'We need a LEO constellation design review.',
  sourceLocale: 'en',
  targetLocale: 'es' as const,
  rateLimitKey: 'mentee-uuid',
};

describe('validateTranslateSegmentInput', () => {
  it('rejects short text', () => {
    expect(() =>
      validateTranslateSegmentInput({ ...baseInput, text: 'ok' }),
    ).toThrow(TranslateSegmentError);
  });

  it('rejects same-language translation', () => {
    expect(() =>
      validateTranslateSegmentInput({ ...baseInput, targetLocale: 'en' }),
    ).toThrow(TranslateSegmentError);
  });
});

describe('translateSegment', () => {
  beforeEach(() => {
    clearAllSegmentCaches();
    vi.mocked(generatePlainText).mockReset();
    process.env.E2E_STUB_LLM = 'false';
  });

  afterEach(() => {
    delete process.env.E2E_STUB_LLM;
  });

  it('uses E2E stub via generatePlainText', async () => {
    process.env.E2E_STUB_LLM = 'true';
    const result = await translateSegment(baseInput);
    expect(result.translatedText).toBe(`[es] ${baseInput.text}`);
    expect(result.cacheHit).toBe(false);
    expect(generatePlainText).toHaveBeenCalled();
  });

  it('returns cache hit on repeated text', async () => {
    process.env.E2E_STUB_LLM = 'true';
    const first = await translateSegment(baseInput);
    const second = await translateSegment({ ...baseInput, segmentId: 'seg-2' });
    expect(first.cacheHit).toBe(false);
    expect(second.cacheHit).toBe(true);
    expect(second.translatedText).toBe(first.translatedText);
  });

  it('calls generatePlainText with glossary system prompt', async () => {
    vi.mocked(generatePlainText).mockResolvedValue('Revisión de diseño');

    const result = await translateSegment(baseInput);

    expect(result.translatedText).toBe('Revisión de diseño');
    expect(generatePlainText).toHaveBeenCalledWith(
      expect.objectContaining({
        systemInstruction: expect.stringContaining('LEO'),
        prompt: expect.stringContaining(baseInput.text),
        rateLimitKey: baseInput.rateLimitKey,
      }),
    );
  });
});
