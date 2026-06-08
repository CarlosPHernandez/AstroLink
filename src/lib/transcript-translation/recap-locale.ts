import type { SessionData } from '@/lib/session';
import {
  SUPPORTED_TARGET_LOCALES,
  isSupportedTargetLocale,
  type SupportedTargetLocale,
} from '@/lib/transcript-translation/types';
import type { PostSessionOutput } from '@/lib/types';

export type RecapLocaleParseResult =
  | { ok: true; locale: SupportedTargetLocale }
  | { ok: false; error: string };

/**
 * Resolve requested recap locale from query string and viewer role (D4/D5).
 * Mentee default: profile locale; mentor/admin default: English.
 */
export function parseRecapLocaleQuery(
  searchParams: URLSearchParams,
  role: SessionData['role'],
  userPreferredLocale: string | null | undefined,
): RecapLocaleParseResult {
  const explicit = searchParams.get('locale')?.trim();
  if (explicit) {
    if (!isSupportedTargetLocale(explicit)) {
      return {
        ok: false,
        error: `Unsupported locale. Supported: ${SUPPORTED_TARGET_LOCALES.join(', ')}`,
      };
    }
    return { ok: true, locale: explicit };
  }

  if (role === 'mentee') {
    const preferred = userPreferredLocale?.trim();
    if (preferred && isSupportedTargetLocale(preferred)) {
      return { ok: true, locale: preferred };
    }
    return { ok: true, locale: 'en' };
  }

  return { ok: true, locale: 'en' };
}

/**
 * Locales to try when serving a recap (D17: pt-BR → en only; no generic pt in v1).
 */
export function localeFallbackChain(targetLocale: SupportedTargetLocale): SupportedTargetLocale[] {
  if (targetLocale === 'en') {
    return ['en'];
  }
  if (targetLocale === 'pt-BR') {
    return ['pt-BR', 'en'];
  }
  return [targetLocale, 'en'];
}

export type EffectiveRecapResolution = {
  effectiveLocale: SupportedTargetLocale;
  recap: PostSessionOutput | null;
  localized: boolean;
};

function isPostSessionOutput(value: unknown): value is PostSessionOutput {
  return (
    typeof value === 'object' &&
    value !== null &&
    'session_summary' in value &&
    'key_insights' in value
  );
}

/**
 * Pick the first locale in the fallback chain with stored content, else English canonical.
 */
export function resolveEffectiveRecapLocale(input: {
  requestedLocale: SupportedTargetLocale;
  englishRecap: PostSessionOutput | null;
  translationsByLocale: Map<string, PostSessionOutput>;
}): EffectiveRecapResolution {
  const chain = localeFallbackChain(input.requestedLocale);

  for (const locale of chain) {
    if (locale === 'en') {
      if (input.englishRecap) {
        return {
          effectiveLocale: 'en',
          recap: input.englishRecap,
          localized: false,
        };
      }
      continue;
    }

    const translated = input.translationsByLocale.get(locale);
    if (translated) {
      return {
        effectiveLocale: locale,
        recap: translated,
        localized: true,
      };
    }
  }

  return {
    effectiveLocale: 'en',
    recap: input.englishRecap,
    localized: false,
  };
}

export function parsePostSessionOutput(value: unknown): PostSessionOutput | null {
  return isPostSessionOutput(value) ? value : null;
}
