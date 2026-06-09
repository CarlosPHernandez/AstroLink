'use client';

import { useCallback, useRef, useState } from 'react';

import { mapSpeakersToRoles } from '@/lib/transcript-translation/map-speakers';
import { shouldSkipTranslation } from '@/lib/transcript-translation/types';
import type {
  SupportedTargetLocale,
  TranscriptUtterance,
} from '@/lib/transcript-translation/types';

export type CaptionLine = {
  id: string;
  speakerLabel: string;
  text: string;
  translated: boolean;
  loading: boolean;
  error: boolean;
};

type UseLiveCaptionsOptions = {
  bookingId: string;
  mentorId: string;
  menteeId: string;
  sessionRole: 'mentee' | 'mentor' | 'admin';
  targetLocale: SupportedTargetLocale;
  showTranslatedForBuyer: boolean;
  captionsEnabled: boolean;
};

function speakerLabel(role: TranscriptUtterance['speakerRole'], sessionRole: string): string {
  if (role === 'mentor') {
    return 'Expert';
  }
  if (role === 'mentee') {
    return sessionRole === 'mentee' ? 'You' : 'Buyer';
  }
  return 'Speaker';
}

export function useLiveCaptions(options: UseLiveCaptionsOptions) {
  const {
    bookingId,
    mentorId,
    menteeId,
    sessionRole,
    targetLocale,
    showTranslatedForBuyer,
    captionsEnabled,
  } = options;

  const [lines, setLines] = useState<CaptionLine[]>([]);
  const [captionsOn, setCaptionsOn] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);
  const clientCacheRef = useRef<Map<string, string>>(new Map());

  const pushLine = useCallback((line: CaptionLine) => {
    setLines((prev) => [...prev.slice(-49), line]);
  }, []);

  const handleUtterance = useCallback(
    async (raw: TranscriptUtterance) => {
      if (!captionsEnabled || !captionsOn) {
        return;
      }

      const [mapped] = mapSpeakersToRoles([raw], {
        mentorUserId: mentorId,
        menteeUserId: menteeId,
      });
      const label = speakerLabel(mapped.speakerRole, sessionRole);
      const wantsTranslation = showTranslatedForBuyer && sessionRole === 'mentee';
      const skipMt = !wantsTranslation || shouldSkipTranslation('en', targetLocale);

      if (skipMt) {
        pushLine({
          id: mapped.id,
          speakerLabel: label,
          text: mapped.text,
          translated: false,
          loading: false,
          error: false,
        });
        return;
      }

      const cacheKey = `${targetLocale}:${mapped.text}`;
      const cached = clientCacheRef.current.get(cacheKey);
      if (cached) {
        pushLine({
          id: mapped.id,
          speakerLabel: label,
          text: cached,
          translated: true,
          loading: false,
          error: false,
        });
        return;
      }

      const placeholderId = `${mapped.id}-pending`;

      abortRef.current?.abort();
      setLines((prev) => prev.filter((line) => !line.loading));

      pushLine({
        id: placeholderId,
        speakerLabel: label,
        text: mapped.text,
        translated: true,
        loading: true,
        error: false,
      });
      const controller = new AbortController();
      abortRef.current = controller;
      const seq = ++seqRef.current;

      const started = performance.now();

      try {
        const res = await fetch(`/api/session/${bookingId}/translate-segment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            segmentId: mapped.id,
            text: mapped.text,
            sourceLocale: 'en',
            targetLocale,
          }),
          signal: controller.signal,
        });

        const data = (await res.json()) as {
          translatedText?: string;
          error?: string;
          latencyMs?: number;
        };

        if (!res.ok) {
          throw new Error(data.error ?? 'Translation failed');
        }

        if (seq !== seqRef.current) {
          setLines((prev) => prev.filter((line) => line.id !== placeholderId));
          return;
        }

        const translatedText = data.translatedText ?? mapped.text;
        clientCacheRef.current.set(cacheKey, translatedText);

        if (process.env.NODE_ENV !== 'production') {
          const delta = performance.now() - started;
          console.debug('[captions] segment latency ms', Math.round(delta), data.latencyMs);
        }

        setLines((prev) =>
          prev.map((line) =>
            line.id === placeholderId
              ? {
                  ...line,
                  id: mapped.id,
                  text: translatedText,
                  loading: false,
                  error: false,
                }
              : line,
          ),
        );
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setLines((prev) => prev.filter((line) => line.id !== placeholderId));
          return;
        }
        if (seq !== seqRef.current) {
          setLines((prev) => prev.filter((line) => line.id !== placeholderId));
          return;
        }
        setLines((prev) =>
          prev.map((line) =>
            line.id === placeholderId
              ? {
                  ...line,
                  id: mapped.id,
                  text: mapped.text,
                  loading: false,
                  error: true,
                }
              : line,
          ),
        );
      }
    },
    [
      bookingId,
      captionsEnabled,
      captionsOn,
      menteeId,
      mentorId,
      pushLine,
      sessionRole,
      showTranslatedForBuyer,
      targetLocale,
    ],
  );

  return {
    lines: captionsOn ? lines : [],
    captionsOn,
    setCaptionsOn,
    handleUtterance,
    captionsEnabled,
  };
}
