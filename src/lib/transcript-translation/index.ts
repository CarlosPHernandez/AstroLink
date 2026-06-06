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
export { parseWebVtt } from '@/lib/transcript-translation/parse-webvtt';
export { mapSpeakersToRoles } from '@/lib/transcript-translation/map-speakers';
export type { SpeakerMappingContext } from '@/lib/transcript-translation/map-speakers';
export { fetchDailyTranscriptVtt } from '@/lib/transcript-translation/fetch-daily-transcript';
export { persistSessionTranscript } from '@/lib/transcript-translation/persist-transcript';
