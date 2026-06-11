export {
  AEROSPACE_GLOSSARY,
  GLOSSARY_VERSION,
  buildGlossaryPromptFragment,
  buildTranslationSystemPrompt,
} from '@/lib/transcript-translation/glossary';
export {
  DEFAULT_TRANSCRIPT_WINDOW_OPTIONS,
  SUPPORTED_TARGET_LOCALES,
  TRANSLATION_AGENT_ID,
  isSupportedTargetLocale,
  shouldSkipTranslation,
} from '@/lib/transcript-translation/types';
export type {
  SessionTranscriptRecord,
  SupportedTargetLocale,
  TranscriptSpeakerRole,
  TranscriptUtterance,
  TranscriptWindow,
  TranscriptWindowOptions,
  TranslateSegmentInput,
  TranslateSegmentResult,
} from '@/lib/transcript-translation/types';
export {
  MAX_SEGMENT_TOKENS,
  estimateTranscriptTokens,
  isSegmentWithinBudget,
  selectTranscriptWindow,
  stripFillerForSynthesis,
} from '@/lib/transcript-translation/token-budget';
export {
  parseTranscriptionMessage,
  transcriptionDedupeKey,
} from '@/lib/transcript-translation/daily-transcription';
export type { DailyTranscriptionMessagePayload } from '@/lib/transcript-translation/daily-transcription';
export {
  SegmentTranslationCache,
  buildSegmentCacheKey,
  clearAllSegmentCaches,
  getSegmentCacheForBooking,
  hashSegmentText,
} from '@/lib/transcript-translation/segment-cache';
export {
  translateSegment,
  validateTranslateSegmentInput,
  TranslateSegmentError,
} from '@/lib/transcript-translation/translate-segment';
export type { TranslateSegmentErrorCode } from '@/lib/transcript-translation/translate-segment';
export { parseWebVtt } from '@/lib/transcript-translation/parse-webvtt';
export { mapSpeakersToRoles } from '@/lib/transcript-translation/map-speakers';
export { resolveCaptionDirection, resolveViewerLocale } from '@/lib/transcript-translation/caption-direction';
export type { CaptionDirection, CaptionViewerRole } from '@/lib/transcript-translation/caption-direction';
export { resolveSpeakerUserId } from '@/lib/transcript-translation/resolve-speaker';
export type { DailyParticipantRecord, DailyParticipantsMap } from '@/lib/transcript-translation/resolve-speaker';
export {
  MAX_IN_FLIGHT_TRANSLATIONS,
  admitTranslationRequest,
  buildTranslationCacheKey,
  dequeueNextTranslationWork,
  isGracefulTranslationFallback,
  releaseTranslationSlot,
} from '@/lib/transcript-translation/translation-queue';
export type { TranslationQueueSnapshot } from '@/lib/transcript-translation/translation-queue';
export {
  BATCH_CHUNK_SIZE,
  buildTranscriptTranslationCacheKey,
  chunkUtterances,
  clearTranscriptTranslationCache,
  getCachedTranscriptTranslation,
  setCachedTranscriptTranslation,
  translateTranscriptUtterances,
} from '@/lib/transcript-translation/batch-translate';
export type { SpeakerMappingContext } from '@/lib/transcript-translation/map-speakers';
export { fetchDailyTranscriptVtt } from '@/lib/transcript-translation/fetch-daily-transcript';
export { persistSessionTranscript } from '@/lib/transcript-translation/persist-transcript';
export {
  localeFallbackChain,
  parsePostSessionOutput,
  parseRecapLocaleQuery,
  PostSessionOutputSchema,
  resolveEffectiveRecapLocale,
} from '@/lib/transcript-translation/recap-locale';
export type {
  EffectiveRecapResolution,
  RecapLocaleParseResult,
} from '@/lib/transcript-translation/recap-locale';
