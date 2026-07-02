import 'server-only';

import { callLlmWithBackoff, generatePlainText, llmFlashModel } from '@/lib/llm';
import { buildTranslationSystemPrompt } from '@/lib/transcript-translation/glossary';
import type { TranscriptUtterance } from '@/lib/transcript-translation/types';

export const BATCH_CHUNK_SIZE = 20;

export function chunkUtterances<T>(items: T[], chunkSize = BATCH_CHUNK_SIZE): T[][] {
  if (items.length === 0) {
    return [];
  }
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export function buildTranscriptTranslationCacheKey(
  bookingId: string,
  targetLocale: string,
): string {
  return `${bookingId}:${targetLocale}`;
}

type TranscriptTranslationCacheEntry = {
  utterances: TranscriptUtterance[];
};

const transcriptTranslationCache = new Map<string, TranscriptTranslationCacheEntry>();

export function getCachedTranscriptTranslation(
  bookingId: string,
  targetLocale: string,
): TranscriptUtterance[] | null {
  const key = buildTranscriptTranslationCacheKey(bookingId, targetLocale);
  return transcriptTranslationCache.get(key)?.utterances ?? null;
}

export function setCachedTranscriptTranslation(
  bookingId: string,
  targetLocale: string,
  utterances: TranscriptUtterance[],
): void {
  const key = buildTranscriptTranslationCacheKey(bookingId, targetLocale);
  transcriptTranslationCache.set(key, { utterances });
}

/** Test helper — reset in-memory transcript translation cache. */
export function clearTranscriptTranslationCache(): void {
  transcriptTranslationCache.clear();
}

function formatChunkForPrompt(utterances: TranscriptUtterance[]): string {
  return utterances
    .map((u, index) => `${index + 1}. [${u.speakerRole}] ${u.text}`)
    .join('\n');
}

function parseNumberedLines(raw: string, expectedCount: number): string[] | null {
  const lines = raw
    .split('\n')
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  if (lines.length !== expectedCount) {
    return null;
  }
  return lines;
}

/**
 * Translate utterance chunks via APX-06 plain-text batch calls.
 * Partial failure: failed chunks keep source text; other chunks still return.
 */
export async function translateTranscriptUtterances(params: {
  bookingId: string;
  utterances: TranscriptUtterance[];
  sourceLocale: string;
  targetLocale: string;
  rateLimitKey: string;
}): Promise<TranscriptUtterance[]> {
  const chunks = chunkUtterances(params.utterances);
  const translated: TranscriptUtterance[] = [];

  for (const chunk of chunks) {
    const systemInstruction = buildTranslationSystemPrompt({
      sourceLocale: params.sourceLocale,
      targetLocale: params.targetLocale,
    });

    const prompt = `Translate each numbered line from ${params.sourceLocale} to ${params.targetLocale}. Return the same number of lines in the same order, numbered 1..n. Return only the translated lines.\n\n${formatChunkForPrompt(chunk)}`;

    try {
      const raw = await callLlmWithBackoff(() =>
        generatePlainText({
          model: llmFlashModel,
          rateLimitKey: params.rateLimitKey,
          systemInstruction,
          prompt,
          audit: {
            agentId: 'APX-06',
            operation: 'transcript_batch',
            refId: params.bookingId,
          },
        }),
      );

      const lines = parseNumberedLines(raw, chunk.length);
      if (!lines) {
        translated.push(...chunk);
        continue;
      }

      for (let i = 0; i < chunk.length; i += 1) {
        const source = chunk[i];
        if (!source) {
          continue;
        }
        translated.push({
          ...source,
          text: lines[i] ?? source.text,
        });
      }
    } catch {
      translated.push(...chunk);
    }
  }

  return translated;
}
