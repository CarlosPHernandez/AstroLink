import {
  shouldSkipTranslation,
  type SupportedTargetLocale,
} from '@/lib/transcript-translation/types';

export type CaptionViewerRole = 'mentee' | 'mentor' | 'admin';

export function resolveViewerLocale(
  role: CaptionViewerRole,
  menteePreferredLocale: SupportedTargetLocale,
): SupportedTargetLocale {
  if (role === 'mentee') {
    return menteePreferredLocale;
  }
  return 'en';
}

export type CaptionDirection = {
  viewerLocale: SupportedTargetLocale;
  sourceLocale: string;
  targetLocale: SupportedTargetLocale;
  shouldTranslate: boolean;
};

/**
 * Per-utterance caption direction: translate when detected speech locale ≠ viewer locale.
 */
export function resolveCaptionDirection(params: {
  viewerRole: CaptionViewerRole;
  menteePreferredLocale: SupportedTargetLocale;
  detectedLocale?: string;
}): CaptionDirection {
  const viewerLocale = resolveViewerLocale(params.viewerRole, params.menteePreferredLocale);
  // When Deepgram omits languages (en fallback transcription), default to English so we
  // skip translation for same-language viewers rather than mis-translating Spanish speech.
  const sourceLocale = params.detectedLocale?.trim() || 'en';
  const shouldTranslate = !shouldSkipTranslation(sourceLocale, viewerLocale);

  return {
    viewerLocale,
    sourceLocale,
    targetLocale: viewerLocale,
    shouldTranslate,
  };
}
