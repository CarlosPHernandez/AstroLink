import {
  isSupportedTargetLocale,
  SUPPORTED_TARGET_LOCALES,
  type SupportedTargetLocale,
} from '@/lib/transcript-translation/types';

export const LOCALE_LABELS: Record<SupportedTargetLocale, string> = {
  en: 'English',
  es: 'Español',
  'pt-BR': 'Português (Brasil)',
  fr: 'Français',
  ja: '日本語',
};

export { SUPPORTED_TARGET_LOCALES };

/** Map a BCP-47 browser tag onto the five locales we actually caption. */
export function guessSupportedLocale(tag: string | null | undefined): SupportedTargetLocale {
  if (!tag?.trim()) {
    return 'en';
  }
  const normalized = tag.trim().toLowerCase().replaceAll('_', '-');
  if (normalized === 'pt-br' || normalized.startsWith('pt-br')) {
    return 'pt-BR';
  }
  if (isSupportedTargetLocale(normalized)) {
    return normalized;
  }
  const primary = normalized.split('-')[0] ?? '';
  if (primary === 'es') return 'es';
  if (primary === 'pt') return 'pt-BR';
  if (primary === 'fr') return 'fr';
  if (primary === 'ja') return 'ja';
  if (primary === 'en') return 'en';
  return 'en';
}

export function resolveJoinLocale(
  savedLocale: SupportedTargetLocale,
  browserTag: string | null | undefined,
): { locale: SupportedTargetLocale; guessed: boolean } {
  if (savedLocale !== 'en') {
    return { locale: savedLocale, guessed: false };
  }
  const hint = guessSupportedLocale(browserTag);
  if (hint !== 'en') {
    return { locale: hint, guessed: true };
  }
  return { locale: 'en', guessed: false };
}
