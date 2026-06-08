import { describe, expect, it } from 'vitest';

import {
  localeFallbackChain,
  parsePostSessionOutput,
  parseRecapLocaleQuery,
  resolveEffectiveRecapLocale,
} from '@/lib/transcript-translation/recap-locale';
import type { PostSessionOutput } from '@/lib/types';

const englishRecap: PostSessionOutput = {
  session_summary: 'English summary',
  key_insights: ['insight'],
  action_items: [],
  mentor_feedback_prompt: 'feedback',
  recommended_next_session: 'next',
};

const portugueseRecap: PostSessionOutput = {
  session_summary: '[pt-BR] Portuguese summary',
  key_insights: ['[pt-BR] insight'],
  action_items: [],
  mentor_feedback_prompt: '[pt-BR] feedback',
  recommended_next_session: '[pt-BR] next',
};

describe('localeFallbackChain', () => {
  it('returns en only for English', () => {
    expect(localeFallbackChain('en')).toEqual(['en']);
  });

  it('returns pt-BR then en for Brazilian Portuguese (D17)', () => {
    expect(localeFallbackChain('pt-BR')).toEqual(['pt-BR', 'en']);
  });

  it('returns target then en for other locales', () => {
    expect(localeFallbackChain('es')).toEqual(['es', 'en']);
  });
});

describe('parseRecapLocaleQuery', () => {
  it('defaults mentee to profile locale (D4)', () => {
    const result = parseRecapLocaleQuery(new URLSearchParams(), 'mentee', 'pt-BR');
    expect(result).toEqual({ ok: true, locale: 'pt-BR' });
  });

  it('defaults mentor to English (D4)', () => {
    const result = parseRecapLocaleQuery(new URLSearchParams(), 'mentor', 'pt-BR');
    expect(result).toEqual({ ok: true, locale: 'en' });
  });

  it('honors explicit locale for any participant (D5)', () => {
    const params = new URLSearchParams({ locale: 'fr' });
    const result = parseRecapLocaleQuery(params, 'mentor', 'en');
    expect(result).toEqual({ ok: true, locale: 'fr' });
  });

  it('rejects invalid locale with supported list', () => {
    const params = new URLSearchParams({ locale: 'de' });
    const result = parseRecapLocaleQuery(params, 'mentee', 'en');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Unsupported locale');
      expect(result.error).toContain('pt-BR');
    }
  });
});

describe('parsePostSessionOutput', () => {
  it('accepts a full recap shape', () => {
    expect(parsePostSessionOutput(englishRecap)).toEqual(englishRecap);
  });

  it('rejects partial recap objects missing required fields', () => {
    expect(
      parsePostSessionOutput({
        session_summary: 'Summary only',
        key_insights: ['one'],
      }),
    ).toBeNull();
  });

  it('rejects recap objects with invalid action item owners', () => {
    expect(
      parsePostSessionOutput({
        ...englishRecap,
        action_items: [{ task: 'x', owner: 'admin', deadline: 'soon' }],
      }),
    ).toBeNull();
  });
});

describe('resolveEffectiveRecapLocale', () => {
  it('serves localized recap when translation exists', () => {
    const result = resolveEffectiveRecapLocale({
      requestedLocale: 'pt-BR',
      englishRecap,
      translationsByLocale: new Map([['pt-BR', portugueseRecap]]),
    });

    expect(result).toEqual({
      effectiveLocale: 'pt-BR',
      recap: portugueseRecap,
      localized: true,
    });
  });

  it('falls back to English when pt-BR translation is missing', () => {
    const result = resolveEffectiveRecapLocale({
      requestedLocale: 'pt-BR',
      englishRecap,
      translationsByLocale: new Map(),
    });

    expect(result.effectiveLocale).toBe('en');
    expect(result.recap).toEqual(englishRecap);
    expect(result.localized).toBe(false);
  });
});
