import { describe, expect, it } from 'vitest';
import {
  guessSupportedLocale,
  resolveJoinLocale,
} from '@/lib/transcript-translation/guess-supported-locale';

describe('guessSupportedLocale', () => {
  it('maps Spanish and Brazilian Portuguese regional tags', () => {
    expect(guessSupportedLocale('es-MX')).toBe('es');
    expect(guessSupportedLocale('pt-BR')).toBe('pt-BR');
    expect(guessSupportedLocale('pt-PT')).toBe('pt-BR');
  });

  it('maps English and unsupported browsers to English', () => {
    expect(guessSupportedLocale('en-US')).toBe('en');
    expect(guessSupportedLocale('de-DE')).toBe('en');
    expect(guessSupportedLocale(null)).toBe('en');
    expect(guessSupportedLocale('   ')).toBe('en');
  });

  it('normalizes underscores and extra Portuguese region tags', () => {
    expect(guessSupportedLocale('pt_BR')).toBe('pt-BR');
    expect(guessSupportedLocale('pt-br-x-formal')).toBe('pt-BR');
    expect(guessSupportedLocale('PT')).toBe('pt-BR');
  });

  it('maps exact launch locales and their primary tags', () => {
    expect(guessSupportedLocale('es')).toBe('es');
    expect(guessSupportedLocale('fr')).toBe('fr');
    expect(guessSupportedLocale('fr-CA')).toBe('fr');
    expect(guessSupportedLocale('ja')).toBe('ja');
    expect(guessSupportedLocale('ja-JP')).toBe('ja');
  });
});

describe('resolveJoinLocale', () => {
  it('keeps a saved non-English locale even if the browser is English', () => {
    expect(resolveJoinLocale('es', 'en-US')).toEqual({ locale: 'es', guessed: false });
  });

  it('hints from the browser only when the profile is still the English default', () => {
    expect(resolveJoinLocale('en', 'es-419')).toEqual({ locale: 'es', guessed: true });
    expect(resolveJoinLocale('en', 'en-GB')).toEqual({ locale: 'en', guessed: false });
  });
});
