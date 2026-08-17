'use client';

import { useEffect, useState } from 'react';

import {
  guessSupportedLocale,
  LOCALE_LABELS,
  resolveJoinLocale,
} from '@/lib/transcript-translation/guess-supported-locale';
import {
  SUPPORTED_TARGET_LOCALES,
  type SupportedTargetLocale,
} from '@/lib/transcript-translation/types';

type CaptionLanguageGateProps = {
  savedLocale: SupportedTargetLocale;
  onContinue: (locale: SupportedTargetLocale) => void;
};

export function CaptionLanguageGate({ savedLocale, onContinue }: CaptionLanguageGateProps) {
  const [locale, setLocale] = useState<SupportedTargetLocale>(savedLocale);
  const [browserTag, setBrowserTag] = useState<string | undefined>(undefined);
  const [hintedLocale, setHintedLocale] = useState<SupportedTargetLocale | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const tag = navigator.language;
    const resolved = resolveJoinLocale(savedLocale, tag);
    setBrowserTag(tag);
    setLocale(resolved.locale);
    setHintedLocale(resolved.guessed ? resolved.locale : null);
  }, [savedLocale]);

  const guessed = hintedLocale !== null && locale === hintedLocale;

  const continueWith = async () => {
    setSaving(true);
    try {
      await fetch('/api/me/preferred-locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
    } catch {
      // Join still proceeds with the in-memory choice.
    } finally {
      setSaving(false);
      onContinue(locale);
    }
  };

  return (
    <div
      className="w-full max-w-[var(--max-width-content)] mx-auto rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-left shadow-sm sm:p-8"
      data-testid="caption-language-gate"
    >
      <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">
        Before you join
      </p>
      <h2 className="mt-2 text-headline-md font-bold text-on-surface">
        Captions and recap language
      </h2>
      <p className="mt-2 text-body-md text-on-surface-variant">
        We will show the other person&apos;s speech in this language. You can change it later in
        settings.
      </p>

      <label htmlFor="session-caption-locale" className="mt-5 block text-label-sm text-on-surface">
        Language
      </label>
      <select
        id="session-caption-locale"
        data-testid="caption-language-select"
        className="mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        value={locale}
        onChange={(event) => setLocale(event.target.value as SupportedTargetLocale)}
      >
        {SUPPORTED_TARGET_LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>

      {guessed ? (
        <p className="mt-2 text-label-sm text-on-surface-variant" data-testid="caption-language-guess">
          We guessed {LOCALE_LABELS[locale]} from your browser (
          {guessSupportedLocale(browserTag) === locale ? browserTag : locale}). Change it if that is
          wrong.
        </p>
      ) : null}

      <button
        type="button"
        data-testid="caption-language-continue"
        disabled={saving}
        onClick={() => void continueWith()}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 py-2.5 text-label-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Continue to call'}
      </button>
    </div>
  );
}
