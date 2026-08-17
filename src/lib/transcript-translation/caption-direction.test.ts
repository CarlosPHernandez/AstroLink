import { describe, expect, it } from 'vitest';

import {
  inferSourceLocaleFromSpeaker,
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

describe('inferSourceLocaleFromSpeaker', () => {
  it('uses mentee profile locale for mentee speech when Deepgram is silent', () => {
    expect(
      inferSourceLocaleFromSpeaker({ speakerRole: 'mentee', menteePreferredLocale: 'es' }),
    ).toBe('es');
  });

  it('uses English for mentor speech and empty for unknown speakers', () => {
    expect(
      inferSourceLocaleFromSpeaker({ speakerRole: 'mentor', menteePreferredLocale: 'es' }),
    ).toBe('en');
    expect(
      inferSourceLocaleFromSpeaker({ speakerRole: 'unknown', menteePreferredLocale: 'es' }),
    ).toBe('');
  });
});

describe('resolveCaptionDirection', () => {
  it('skips translation when detected locale matches mentee viewer locale', () => {
    const direction = resolveCaptionDirection({
      viewerRole: 'mentee',
      menteePreferredLocale: 'es',
      detectedLocale: 'es',
      speakerRole: 'mentor',
    });
    expect(direction.shouldTranslate).toBe(false);
    expect(direction.targetLocale).toBe('es');
  });

  it('translates English mentor speech to Spanish for Spanish mentee', () => {
    const direction = resolveCaptionDirection({
      viewerRole: 'mentee',
      menteePreferredLocale: 'es',
      detectedLocale: 'en',
      speakerRole: 'mentor',
    });
    expect(direction.shouldTranslate).toBe(true);
    expect(direction.sourceLocale).toBe('en');
    expect(direction.targetLocale).toBe('es');
  });

  it('translates Spanish mentee speech to English for mentor viewer', () => {
    const direction = resolveCaptionDirection({
      viewerRole: 'mentor',
      menteePreferredLocale: 'es',
      detectedLocale: 'es',
      speakerRole: 'mentee',
    });
    expect(direction.shouldTranslate).toBe(true);
    expect(direction.targetLocale).toBe('en');
  });

  it('skips translation for mentor when speech is already English', () => {
    const direction = resolveCaptionDirection({
      viewerRole: 'mentor',
      menteePreferredLocale: 'es',
      detectedLocale: 'en',
      speakerRole: 'mentee',
    });
    expect(direction.shouldTranslate).toBe(false);
  });

  it('does not treat missing detection as English', () => {
    const mentorView = resolveCaptionDirection({
      viewerRole: 'mentor',
      menteePreferredLocale: 'es',
      speakerRole: 'mentee',
    });
    expect(mentorView.sourceLocale).toBe('es');
    expect(mentorView.shouldTranslate).toBe(true);

    const menteeOwn = resolveCaptionDirection({
      viewerRole: 'mentee',
      menteePreferredLocale: 'es',
      speakerRole: 'mentee',
    });
    expect(menteeOwn.shouldTranslate).toBe(false);
  });

  it('does not translate the local speaker for the local viewer', () => {
    const direction = resolveCaptionDirection({
      viewerRole: 'mentee',
      menteePreferredLocale: 'es',
      detectedLocale: 'en',
      speakerRole: 'mentee',
    });
    expect(direction.shouldTranslate).toBe(false);
  });

  it('does not invent a language when speaker and detection are unknown', () => {
    const direction = resolveCaptionDirection({
      viewerRole: 'mentor',
      menteePreferredLocale: 'es',
      speakerRole: 'unknown',
    });
    expect(direction.shouldTranslate).toBe(false);
    expect(direction.sourceLocale).toBe('en');
  });

  it('infers English mentor speech for a mentee when Deepgram is silent', () => {
    const direction = resolveCaptionDirection({
      viewerRole: 'mentee',
      menteePreferredLocale: 'es',
      speakerRole: 'mentor',
    });
    expect(direction.sourceLocale).toBe('en');
    expect(direction.targetLocale).toBe('es');
    expect(direction.shouldTranslate).toBe(true);
  });

  it('treats whitespace-only detection as missing and uses the speaker prior', () => {
    const direction = resolveCaptionDirection({
      viewerRole: 'mentor',
      menteePreferredLocale: 'pt-BR',
      detectedLocale: '   ',
      speakerRole: 'mentee',
    });
    expect(direction.sourceLocale).toBe('pt-BR');
    expect(direction.shouldTranslate).toBe(true);
  });

  it('never treats admin as a local speaker', () => {
    const menteeSpeech = resolveCaptionDirection({
      viewerRole: 'admin',
      menteePreferredLocale: 'es',
      detectedLocale: 'es',
      speakerRole: 'mentee',
    });
    expect(menteeSpeech.viewerLocale).toBe('en');
    expect(menteeSpeech.shouldTranslate).toBe(true);

    const mentorSpeech = resolveCaptionDirection({
      viewerRole: 'admin',
      menteePreferredLocale: 'es',
      detectedLocale: 'en',
      speakerRole: 'mentor',
    });
    expect(mentorSpeech.shouldTranslate).toBe(false);
  });

  it('treats a missing speaker role like unknown', () => {
    expect(
      inferSourceLocaleFromSpeaker({ menteePreferredLocale: 'es' }),
    ).toBe('');
  });
});
