import { describe, expect, it } from 'vitest';

import {
  resolveCaptionDirection,
  resolveViewerLocale,
} from '@/lib/transcript-translation/caption-direction';

describe('resolveViewerLocale', () => {
  it('uses mentee preferred locale for mentee viewer', () => {
    expect(resolveViewerLocale('mentee', 'pt-BR')).toBe('pt-BR');
  });

  it('uses English for mentor and admin viewers', () => {
    expect(resolveViewerLocale('mentor', 'es')).toBe('en');
    expect(resolveViewerLocale('admin', 'es')).toBe('en');
  });
});

describe('resolveCaptionDirection', () => {
  it('skips translation when detected locale matches mentee viewer locale', () => {
    const direction = resolveCaptionDirection({
      viewerRole: 'mentee',
      menteePreferredLocale: 'es',
      detectedLocale: 'es',
    });
    expect(direction.shouldTranslate).toBe(false);
    expect(direction.targetLocale).toBe('es');
  });

  it('translates English speech to Spanish for Spanish mentee', () => {
    const direction = resolveCaptionDirection({
      viewerRole: 'mentee',
      menteePreferredLocale: 'es',
      detectedLocale: 'en',
    });
    expect(direction.shouldTranslate).toBe(true);
    expect(direction.sourceLocale).toBe('en');
    expect(direction.targetLocale).toBe('es');
  });

  it('translates Spanish speech to English for mentor viewer', () => {
    const direction = resolveCaptionDirection({
      viewerRole: 'mentor',
      menteePreferredLocale: 'es',
      detectedLocale: 'es',
    });
    expect(direction.shouldTranslate).toBe(true);
    expect(direction.targetLocale).toBe('en');
  });

  it('skips translation for mentor when speech is already English', () => {
    const direction = resolveCaptionDirection({
      viewerRole: 'mentor',
      menteePreferredLocale: 'es',
      detectedLocale: 'en',
    });
    expect(direction.shouldTranslate).toBe(false);
  });
});
