import { describe, expect, it } from 'vitest';

import {
  honestyCopyForPhase,
  resolveTranscriptHonestyPhase,
  shouldPollForTranscript,
  TRANSCRIPT_HONESTY_COPY,
  TRANSCRIPT_HONESTY_DELAYED_MS,
  TRANSCRIPT_HONESTY_PROCESSING_MS,
} from '@/lib/session-transcript-honesty';

describe('resolveTranscriptHonestyPhase', () => {
  it('returns success when utterances exist', () => {
    expect(
      resolveTranscriptHonestyPhase({
        loading: false,
        hasUtterances: true,
        isLoadError: false,
        isMissing: false,
        missingElapsedMs: 0,
      }),
    ).toBe('success');
  });

  it('returns processing for first 2 minutes of missing', () => {
    expect(
      resolveTranscriptHonestyPhase({
        loading: false,
        hasUtterances: false,
        isLoadError: false,
        isMissing: true,
        missingElapsedMs: 0,
      }),
    ).toBe('processing');
    expect(
      resolveTranscriptHonestyPhase({
        loading: false,
        hasUtterances: false,
        isLoadError: false,
        isMissing: true,
        missingElapsedMs: TRANSCRIPT_HONESTY_PROCESSING_MS - 1,
      }),
    ).toBe('processing');
  });

  it('returns delayed between 2 and 10 minutes', () => {
    expect(
      resolveTranscriptHonestyPhase({
        loading: false,
        hasUtterances: false,
        isLoadError: false,
        isMissing: true,
        missingElapsedMs: TRANSCRIPT_HONESTY_PROCESSING_MS,
      }),
    ).toBe('delayed');
    expect(
      resolveTranscriptHonestyPhase({
        loading: false,
        hasUtterances: false,
        isLoadError: false,
        isMissing: true,
        missingElapsedMs: TRANSCRIPT_HONESTY_DELAYED_MS - 1,
      }),
    ).toBe('delayed');
  });

  it('returns unavailable after 10 minutes', () => {
    expect(
      resolveTranscriptHonestyPhase({
        loading: false,
        hasUtterances: false,
        isLoadError: false,
        isMissing: true,
        missingElapsedMs: TRANSCRIPT_HONESTY_DELAYED_MS,
      }),
    ).toBe('unavailable');
  });

  it('returns error for non-404 failures', () => {
    expect(
      resolveTranscriptHonestyPhase({
        loading: false,
        hasUtterances: false,
        isLoadError: true,
        isMissing: false,
        missingElapsedMs: 0,
      }),
    ).toBe('error');
  });
});

describe('honestyCopyForPhase', () => {
  it('maps phases to locked copy', () => {
    expect(honestyCopyForPhase('processing')).toBe(TRANSCRIPT_HONESTY_COPY.processing);
    expect(honestyCopyForPhase('delayed')).toBe(TRANSCRIPT_HONESTY_COPY.delayed);
    expect(honestyCopyForPhase('unavailable')).toBe(TRANSCRIPT_HONESTY_COPY.unavailable);
  });
});

describe('shouldPollForTranscript', () => {
  it('polls only processing and delayed', () => {
    expect(shouldPollForTranscript('processing')).toBe(true);
    expect(shouldPollForTranscript('delayed')).toBe(true);
    expect(shouldPollForTranscript('unavailable')).toBe(false);
    expect(shouldPollForTranscript('success')).toBe(false);
  });
});
