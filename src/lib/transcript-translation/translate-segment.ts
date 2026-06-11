import 'server-only';

import { callLlmWithBackoff, generatePlainText, llmFlashModel } from '@/lib/llm';
import { buildTranslationSystemPrompt } from '@/lib/transcript-translation/glossary';
import {
  buildSegmentCacheKey,
  getSegmentCacheForBooking,
} from '@/lib/transcript-translation/segment-cache';
import {
  isSegmentWithinBudget,
  estimateTranscriptTokens,
} from '@/lib/transcript-translation/token-budget';
import {
  shouldSkipTranslation,
  type TranslateSegmentInput,
  type TranslateSegmentResult,
} from '@/lib/transcript-translation/types';

const MIN_SEGMENT_TEXT_LENGTH = 3;

export type TranslateSegmentErrorCode =
  | 'text_too_short'
  | 'budget_exceeded'
  | 'same_language';

export class TranslateSegmentError extends Error {
  constructor(
    message: string,
    readonly code: TranslateSegmentErrorCode,
  ) {
    super(message);
    this.name = 'TranslateSegmentError';
  }
}

export function validateTranslateSegmentInput(input: TranslateSegmentInput): void {
  const text = input.text.trim();
  if (text.length < MIN_SEGMENT_TEXT_LENGTH) {
    throw new TranslateSegmentError('Segment text too short', 'text_too_short');
  }
  if (!isSegmentWithinBudget(text)) {
    throw new TranslateSegmentError('Segment exceeds token budget', 'budget_exceeded');
  }
  if (shouldSkipTranslation(input.sourceLocale, input.targetLocale)) {
    throw new TranslateSegmentError('Translation skipped for same language', 'same_language');
  }
}

/**
 * Translate a single live caption segment (APX-06). Uses per-booking LRU cache.
 */
export async function translateSegment(
  input: TranslateSegmentInput,
): Promise<TranslateSegmentResult> {
  validateTranslateSegmentInput(input);

  const text = input.text.trim();
  const cacheKey = buildSegmentCacheKey({
    bookingId: input.bookingId,
    text,
    sourceLocale: input.sourceLocale,
    targetLocale: input.targetLocale,
  });
  const cache = getSegmentCacheForBooking(input.bookingId);
  const cached = cache.get(cacheKey);
  if (cached) {
    return {
      segmentId: input.segmentId,
      translatedText: cached,
      sourceLocale: input.sourceLocale,
      targetLocale: input.targetLocale,
      cacheHit: true,
      estimatedInputTokens: estimateTranscriptTokens(text),
    };
  }

  const systemInstruction = buildTranslationSystemPrompt({
    sourceLocale: input.sourceLocale,
    targetLocale: input.targetLocale,
    sessionKeywords: input.sessionKeywords,
  });

  const prompt = `Translate this spoken caption line from ${input.sourceLocale} to ${input.targetLocale}. Return only the translated line, no quotes or commentary.\n\n${text}`;

  const translatedText = await callLlmWithBackoff(() =>
    generatePlainText({
      model: llmFlashModel,
      rateLimitKey: input.rateLimitKey,
      rateLimitScope: 'caption',
      systemInstruction,
      prompt,
    }),
  );

  const normalized = translatedText.trim();
  cache.set(cacheKey, normalized);

  return {
    segmentId: input.segmentId,
    translatedText: normalized,
    sourceLocale: input.sourceLocale,
    targetLocale: input.targetLocale,
    cacheHit: false,
    estimatedInputTokens: estimateTranscriptTokens(text),
  };
}
