'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  honestyCopyForPhase,
  resolveTranscriptHonestyPhase,
  shouldPollForTranscript,
  TRANSCRIPT_HONESTY_POLL_MS,
  type TranscriptHonestyPhase,
} from '@/lib/session-transcript-honesty';
import { resolveSessionSpeakerLabel } from '@/lib/transcript-translation/speaker-label';
import type { TranscriptUtterance } from '@/lib/transcript-translation/types';

type TranscriptResponse = {
  utterances?: TranscriptUtterance[];
  sourceLocale?: string;
  status?: 'ready' | 'empty';
  hasVtt?: boolean;
  error?: string;
};

type TranslateTranscriptResponse = {
  utterances?: TranscriptUtterance[];
  targetLocale?: string;
  cacheHit?: boolean;
  error?: string;
};

type LoadOutcome =
  | { kind: 'success'; utterances: TranscriptUtterance[]; sourceLocale?: string }
  | { kind: 'missing' }
  | { kind: 'empty_stored'; hasVtt?: boolean }
  | { kind: 'error'; message: string };

async function fetchTranscript(bookingId: string): Promise<LoadOutcome> {
  const res = await fetch(`/api/session/${bookingId}/transcript`);
  let data: TranscriptResponse = {};
  try {
    data = (await res.json()) as TranscriptResponse;
  } catch {
    data = {};
  }

  if (res.status === 404) {
    return { kind: 'missing' };
  }
  if (!res.ok) {
    return { kind: 'error', message: data.error ?? 'Could not load transcript' };
  }

  const utterances = data.utterances ?? [];
  if (utterances.length > 0) {
    return { kind: 'success', utterances, sourceLocale: data.sourceLocale };
  }

  // Explicit empty stored row (or legacy 200 with [] after row existed)
  if (data.status === 'empty' || data.status === 'ready') {
    return { kind: 'empty_stored', hasVtt: data.hasVtt };
  }

  // Ambiguous empty 200 without status: treat as empty stored, not "still preparing"
  return { kind: 'empty_stored', hasVtt: data.hasVtt };
}

export function SessionTranscriptPanel({
  bookingId,
  mentorName,
  menteeName,
  viewerRole,
}: {
  bookingId: string;
  mentorName: string;
  menteeName: string;
  viewerRole: 'mentee' | 'mentor' | 'admin';
}) {
  const [loading, setLoading] = useState(true);
  const [isLoadError, setIsLoadError] = useState(false);
  const [isMissing, setIsMissing] = useState(false);
  const [isEmptyStored, setIsEmptyStored] = useState(false);
  const [canonical, setCanonical] = useState<TranscriptUtterance[]>([]);
  const [display, setDisplay] = useState<TranscriptUtterance[]>([]);
  const [viewLocalized, setViewLocalized] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [targetLocale, setTargetLocale] = useState('es');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const missingSinceRef = useRef<number | null>(null);

  const applyOutcome = useCallback((outcome: LoadOutcome) => {
    if (outcome.kind === 'success') {
      missingSinceRef.current = null;
      setIsMissing(false);
      setIsEmptyStored(false);
      setIsLoadError(false);
      setCanonical(outcome.utterances);
      setDisplay(outcome.utterances);
      setTargetLocale(outcome.sourceLocale === 'es' ? 'en' : 'es');
      return;
    }
    if (outcome.kind === 'missing') {
      if (missingSinceRef.current == null) {
        missingSinceRef.current = Date.now();
      }
      setIsMissing(true);
      setIsEmptyStored(false);
      setIsLoadError(false);
      setCanonical([]);
      setDisplay([]);
      return;
    }
    if (outcome.kind === 'empty_stored') {
      missingSinceRef.current = null;
      setIsMissing(false);
      setIsEmptyStored(true);
      setIsLoadError(false);
      setCanonical([]);
      setDisplay([]);
      return;
    }
    setIsLoadError(true);
    setIsMissing(false);
    setIsEmptyStored(false);
    setCanonical([]);
    setDisplay([]);
  }, []);

  const loadOnce = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        setLoading(true);
      }
      try {
        const outcome = await fetchTranscript(bookingId);
        applyOutcome(outcome);
      } catch {
        setIsLoadError(true);
        setIsMissing(false);
        setIsEmptyStored(false);
        setCanonical([]);
        setDisplay([]);
      } finally {
        if (!opts?.silent) {
          setLoading(false);
        }
      }
    },
    [applyOutcome, bookingId],
  );

  useEffect(() => {
    void loadOnce();
  }, [loadOnce]);

  const missingElapsedMs =
    missingSinceRef.current != null ? Math.max(0, nowMs - missingSinceRef.current) : 0;

  const phase: TranscriptHonestyPhase = resolveTranscriptHonestyPhase({
    loading,
    hasUtterances: display.length > 0,
    isLoadError,
    isMissing,
    isEmptyStored,
    missingElapsedMs,
  });

  // Advance honesty clock while missing so processing → delayed → unavailable.
  useEffect(() => {
    if (!isMissing || display.length > 0) {
      return;
    }
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [display.length, isMissing]);

  // Poll API while processing/delayed (true wait only).
  useEffect(() => {
    if (!shouldPollForTranscript(phase)) {
      return;
    }
    const id = window.setInterval(() => {
      void loadOnce({ silent: true });
    }, TRANSCRIPT_HONESTY_POLL_MS);
    return () => window.clearInterval(id);
  }, [loadOnce, phase]);

  const toggleLocalized = useCallback(async () => {
    if (viewLocalized) {
      setDisplay(canonical);
      setViewLocalized(false);
      return;
    }

    setTranslating(true);
    setTranslateError(null);
    try {
      const res = await fetch(`/api/session/${bookingId}/transcript/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLocale }),
      });
      const data = (await res.json()) as TranslateTranscriptResponse;
      if (!res.ok) {
        throw new Error(data.error ?? 'Translation failed');
      }
      setDisplay(data.utterances ?? canonical);
      setViewLocalized(true);
    } catch (err: unknown) {
      setTranslateError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setTranslating(false);
    }
  }, [bookingId, canonical, targetLocale, viewLocalized]);

  if (phase === 'loading') {
    return (
      <p
        className="text-body-md text-on-surface-variant mb-6"
        data-testid="session-transcript-loading"
        aria-live="polite"
      >
        {honestyCopyForPhase('loading')}
      </p>
    );
  }

  if (phase === 'error') {
    return (
      <div className="mb-6 space-y-2" data-testid="session-transcript-error">
        <p className="text-body-md text-on-surface-variant" aria-live="polite">
          {honestyCopyForPhase('error')}
        </p>
        <button
          type="button"
          data-testid="session-transcript-retry"
          onClick={() => void loadOnce()}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-outline-variant px-5 py-2.5 text-label-sm font-semibold text-on-surface"
        >
          Retry
        </button>
      </div>
    );
  }

  if (phase === 'empty_stored') {
    return (
      <p
        className="text-body-md text-on-surface-variant mb-6"
        data-testid="session-transcript-empty-stored"
        aria-live="polite"
      >
        {honestyCopyForPhase('empty_stored')}
      </p>
    );
  }

  if (phase === 'processing' || phase === 'delayed' || phase === 'unavailable') {
    return (
      <p
        className="text-body-md text-on-surface-variant mb-6"
        data-testid={
          phase === 'processing'
            ? 'session-transcript-processing'
            : phase === 'delayed'
              ? 'session-transcript-delayed'
              : 'session-transcript-unavailable'
        }
        aria-live="polite"
      >
        {honestyCopyForPhase(phase)}
      </p>
    );
  }

  const localeLabel = targetLocale === 'es' ? 'Español' : targetLocale;

  return (
    <div className="mb-6 w-full text-left" data-testid="session-transcript-panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-label-sm font-semibold text-on-surface">Session transcript</h4>
        <button
          type="button"
          data-testid="session-transcript-locale-toggle"
          disabled={translating}
          onClick={() => void toggleLocalized()}
          className="text-label-sm font-semibold text-primary underline disabled:opacity-50"
        >
          {viewLocalized ? 'View original' : `View in ${localeLabel}`}
        </button>
      </div>
      {translateError ? (
        <p className="text-label-sm text-error mb-2" data-testid="session-transcript-inline-error">
          {translateError}
        </p>
      ) : null}
      <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-outline-variant bg-surface-container-low p-3">
        {display.map((utterance) => (
          <li key={utterance.id} className="text-body-md text-on-surface">
            <span className="text-label-sm font-semibold text-on-surface-variant">
              {resolveSessionSpeakerLabel({
                speakerRole: utterance.speakerRole,
                viewerRole,
                mentorFullName: mentorName,
                menteeFullName: menteeName,
              })}
              :{' '}
            </span>
            {utterance.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
