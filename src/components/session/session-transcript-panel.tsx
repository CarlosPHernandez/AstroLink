'use client';

import { useCallback, useEffect, useState } from 'react';

import { resolveSessionSpeakerLabel } from '@/lib/transcript-translation/speaker-label';
import type { TranscriptUtterance } from '@/lib/transcript-translation/types';

type TranscriptResponse = {
  utterances?: TranscriptUtterance[];
  sourceLocale?: string;
  error?: string;
};

type TranslateTranscriptResponse = {
  utterances?: TranscriptUtterance[];
  targetLocale?: string;
  cacheHit?: boolean;
  error?: string;
};

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
  const [error, setError] = useState<string | null>(null);
  const [canonical, setCanonical] = useState<TranscriptUtterance[]>([]);
  const [display, setDisplay] = useState<TranscriptUtterance[]>([]);
  const [viewLocalized, setViewLocalized] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [targetLocale, setTargetLocale] = useState('es');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/session/${bookingId}/transcript`);
        const data = (await res.json()) as TranscriptResponse;
        if (!res.ok) {
          throw new Error(data.error ?? 'Could not load transcript');
        }
        if (cancelled) {
          return;
        }
        const utterances = data.utterances ?? [];
        setCanonical(utterances);
        setDisplay(utterances);
        setTargetLocale(data.sourceLocale === 'es' ? 'en' : 'es');
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load transcript');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const toggleLocalized = useCallback(async () => {
    if (viewLocalized) {
      setDisplay(canonical);
      setViewLocalized(false);
      return;
    }

    setTranslating(true);
    setError(null);
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
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setTranslating(false);
    }
  }, [bookingId, canonical, targetLocale, viewLocalized]);

  if (loading) {
    return (
      <p className="text-body-md text-on-surface-variant mb-6" data-testid="session-transcript-loading">
        Loading session transcript…
      </p>
    );
  }

  if (error && display.length === 0) {
    return (
      <p className="text-body-md text-on-surface-variant mb-6" data-testid="session-transcript-error">
        {error}
      </p>
    );
  }

  if (display.length === 0) {
    return (
      <p
        className="text-body-md text-on-surface-variant mb-6"
        data-testid="session-transcript-unavailable"
      >
        Transcript not available for this session yet.
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
      {error ? (
        <p className="text-label-sm text-error mb-2" data-testid="session-transcript-inline-error">
          {error}
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
