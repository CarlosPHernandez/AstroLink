/**
 * D3 transcript translation — shared types.
 * @see docs/d3-transcript-translation-roadmap.md
 */

/** BCP-47 locale tags supported in D3 v1 launch set. */
export const SUPPORTED_TARGET_LOCALES = ['en', 'es', 'pt-BR', 'fr', 'ja'] as const;

export type SupportedTargetLocale = (typeof SUPPORTED_TARGET_LOCALES)[number];

export type TranscriptSpeakerRole = 'mentor' | 'mentee' | 'unknown';

/** Single utterance from Daily transcription or parsed WebVTT. */
export interface TranscriptUtterance {
  id: string;
  speakerId: string;
  speakerRole: TranscriptSpeakerRole;
  startMs: number;
  endMs: number;
  text: string;
  isFinal: boolean;
}

/** Persisted canonical transcript (Phase 1 migration). */
export interface SessionTranscriptRecord {
  bookingId: string;
  sourceLocale: string;
  vttText: string | null;
  utterances: TranscriptUtterance[];
  dailyTranscriptId: string | null;
}

/** Input for a single segment translation (APX-06). */
export interface TranslateSegmentInput {
  bookingId: string;
  segmentId: string;
  text: string;
  sourceLocale: string;
  targetLocale: SupportedTargetLocale;
  /** Mentee UUID for rate limiting. */
  rateLimitKey: string;
  /** Optional APX-02 objective keywords for disambiguation. */
  sessionKeywords?: string[];
}

export interface TranslateSegmentResult {
  segmentId: string;
  translatedText: string;
  sourceLocale: string;
  targetLocale: SupportedTargetLocale;
  cacheHit: boolean;
  estimatedInputTokens: number;
}

/** Truncated transcript window passed to APX-03. */
export interface TranscriptWindow {
  text: string;
  utteranceCount: number;
  totalUtteranceCount: number;
  estimatedTokens: number;
  truncated: boolean;
}

export interface TranscriptWindowOptions {
  /** Max estimated tokens for APX-03 prompt (default 8000). */
  maxTokens?: number;
  /** Minutes from start always included (default 5). */
  headMinutes?: number;
  /** Minutes from end always included (default 5). */
  tailMinutes?: number;
}

export const DEFAULT_TRANSCRIPT_WINDOW_OPTIONS: Required<TranscriptWindowOptions> = {
  maxTokens: 8000,
  headMinutes: 5,
  tailMinutes: 5,
};

/** APX-06 agent identifier — translation jobs. */
export const TRANSLATION_AGENT_ID = 'APX-06' as const;

export function isSupportedTargetLocale(value: string): value is SupportedTargetLocale {
  return (SUPPORTED_TARGET_LOCALES as readonly string[]).includes(value);
}

/** Skip translation when source and target match (e.g. en → en). */
export function shouldSkipTranslation(sourceLocale: string, targetLocale: string): boolean {
  const normalizedSource = sourceLocale.split('-')[0]?.toLowerCase() ?? sourceLocale;
  const normalizedTarget = targetLocale.split('-')[0]?.toLowerCase() ?? targetLocale;
  return normalizedSource === normalizedTarget;
}
