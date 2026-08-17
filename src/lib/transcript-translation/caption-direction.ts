import {
  shouldSkipTranslation,
  type SupportedTargetLocale,
  type TranscriptSpeakerRole,
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

function normalizeLocaleTag(value: string | undefined): string {
  return value?.trim() ?? '';
}

/** Mentee speech defaults to their profile locale; mentor speech defaults to English. */
export function inferSourceLocaleFromSpeaker(params: {
  speakerRole?: TranscriptSpeakerRole;
  menteePreferredLocale: SupportedTargetLocale;
}): string {
  if (params.speakerRole === 'mentee') {
    return params.menteePreferredLocale;
  }
  if (params.speakerRole === 'mentor') {
    return 'en';
  }
  return '';
}

function isLocalSpeaker(
  viewerRole: CaptionViewerRole,
  speakerRole?: TranscriptSpeakerRole,
): boolean {
  if (!speakerRole || speakerRole === 'unknown') {
    return false;
  }
  if (viewerRole === 'admin') {
    return false;
  }
  return viewerRole === speakerRole;
}

/**
 * Per-utterance caption direction.
 *
 * Translate the *other* person's speech into the viewer's locale.
 * Never treat a missing Deepgram language tag as English — that made Spanish
 * look like English (skipped for the mentor, wrongly translated for the mentee).
 */
export function resolveCaptionDirection(params: {
  viewerRole: CaptionViewerRole;
  menteePreferredLocale: SupportedTargetLocale;
  detectedLocale?: string;
  speakerRole?: TranscriptSpeakerRole;
}): CaptionDirection {
  const viewerLocale = resolveViewerLocale(params.viewerRole, params.menteePreferredLocale);
  const detected = normalizeLocaleTag(params.detectedLocale);
  const prior = inferSourceLocaleFromSpeaker({
    speakerRole: params.speakerRole,
    menteePreferredLocale: params.menteePreferredLocale,
  });
  const sourceLocale = detected || prior;

  if (isLocalSpeaker(params.viewerRole, params.speakerRole)) {
    return {
      viewerLocale,
      sourceLocale: sourceLocale || viewerLocale,
      targetLocale: viewerLocale,
      shouldTranslate: false,
    };
  }

  if (!sourceLocale) {
    return {
      viewerLocale,
      sourceLocale: viewerLocale,
      targetLocale: viewerLocale,
      shouldTranslate: false,
    };
  }

  return {
    viewerLocale,
    sourceLocale,
    targetLocale: viewerLocale,
    shouldTranslate: !shouldSkipTranslation(sourceLocale, viewerLocale),
  };
}
