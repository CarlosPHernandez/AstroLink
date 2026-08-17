'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { resolveCaptionDirection } from '@/lib/transcript-translation/caption-direction';
import { mapSpeakersToRoles } from '@/lib/transcript-translation/map-speakers';
import { resolveSessionSpeakerLabel } from '@/lib/transcript-translation/speaker-label';
import {
  admitTranslationRequest,
  buildTranslationCacheKey,
  dequeueNextTranslationWork,
  isGracefulTranslationFallback,
  type TranslationQueueSnapshot,
} from '@/lib/transcript-translation/translation-queue';
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
  menteePreferredLocale: SupportedTargetLocale;
  mentorName: string;
  menteeName: string;
  captionsEnabled: boolean;
  transcriptionUnavailable?: boolean;
};

const DEFAULT_TRANSLATION_PAUSE_MS = 60_000;

type PendingTranslation = {
  segmentId: string;
  placeholderId: string;
  label: string;
  sourceLocale: string;
  targetLocale: SupportedTargetLocale;
  rawText: string;
};

export function useLiveCaptions(options: UseLiveCaptionsOptions) {
  const {
    bookingId,
    mentorId,
    menteeId,
    sessionRole,
    menteePreferredLocale,
    mentorName,
    menteeName,
    captionsEnabled,
    transcriptionUnavailable = false,
  } = options;

  const [lines, setLines] = useState<CaptionLine[]>([]);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [translationPaused, setTranslationPaused] = useState(false);
  const clientCacheRef = useRef<Map<string, string>>(new Map());
  const queueRef = useRef<TranslationQueueSnapshot>({ inFlight: 0, queuedSegmentIds: [] });
  const pendingBySegmentRef = useRef<Map<string, PendingTranslation>>(new Map());
  const pausedDuringLimitRef = useRef<PendingTranslation[]>([]);
  const translationPausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runTranslationRef = useRef<(pending: PendingTranslation) => void>(() => {});
  const scheduleTranslationRef = useRef<(pending: PendingTranslation) => void>(() => {});

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  const scheduleTranslationResume = useCallback((afterMs: number) => {
    const delayMs = Math.max(afterMs, 1_000);
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    translationPausedRef.current = true;
    setTranslationPaused(true);
    resumeTimerRef.current = setTimeout(() => {
      translationPausedRef.current = false;
      setTranslationPaused(false);
      resumeTimerRef.current = null;
      const replay = pausedDuringLimitRef.current;
      pausedDuringLimitRef.current = [];
      for (const pending of replay) {
        scheduleTranslationRef.current(pending);
      }
    }, delayMs);
  }, []);

  const pushLine = useCallback((line: CaptionLine) => {
    setLines((prev) => [...prev.slice(-49), line]);
  }, []);

  const finalizeLine = useCallback(
    (placeholderId: string, segmentId: string, patch: Partial<CaptionLine>) => {
      setLines((prev) =>
        prev.map((line) =>
          line.id === placeholderId
            ? {
                ...line,
                ...patch,
                id: segmentId,
              }
            : line,
        ),
      );
    },
    [],
  );

  const finalizeDroppedTranslation = useCallback(
    (dropped: PendingTranslation) => {
      finalizeLine(dropped.placeholderId, dropped.segmentId, {
        speakerLabel: dropped.label,
        text: dropped.rawText,
        translated: false,
        loading: false,
        error: false,
      });
    },
    [finalizeLine],
  );

  const runTranslation = useCallback(
    async (pending: PendingTranslation) => {
      const { placeholderId, segmentId, label, sourceLocale, targetLocale, rawText } =
        pending;

      try {
        const res = await fetch(`/api/session/${bookingId}/translate-segment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            segmentId,
            text: rawText,
            sourceLocale,
            targetLocale,
          }),
        });

        const data = (await res.json()) as {
          translatedText?: string;
          error?: string;
          code?: string;
          latencyMs?: number;
          retryAfterMs?: number;
        };

        if (!res.ok) {
          if (isGracefulTranslationFallback(data.code)) {
            if (data.code === 'budget_exceeded') {
              scheduleTranslationResume(DEFAULT_TRANSLATION_PAUSE_MS);
            }
            if (data.code === 'rate_limited') {
              scheduleTranslationResume(data.retryAfterMs ?? DEFAULT_TRANSLATION_PAUSE_MS);
            }
            finalizeLine(placeholderId, segmentId, {
              text: rawText,
              translated: false,
              loading: false,
              error: false,
            });
            return;
          }
          throw new Error(data.error ?? 'Translation failed');
        }

        const translatedText = data.translatedText ?? rawText;
        const cacheKey = buildTranslationCacheKey(sourceLocale, targetLocale, rawText);
        clientCacheRef.current.set(cacheKey, translatedText);

        finalizeLine(placeholderId, segmentId, {
          speakerLabel: label,
          text: translatedText,
          translated: true,
          loading: false,
          error: false,
        });
      } catch {
        finalizeLine(placeholderId, segmentId, {
          speakerLabel: label,
          text: rawText,
          translated: false,
          loading: false,
          error: true,
        });
      } finally {
        pendingBySegmentRef.current.delete(segmentId);
        const handoff = dequeueNextTranslationWork(queueRef.current, (id) =>
          pendingBySegmentRef.current.has(id),
        );
        queueRef.current = handoff.snapshot;

        const nextId = handoff.nextSegmentId;
        if (nextId) {
          const nextPending = pendingBySegmentRef.current.get(nextId);
          if (nextPending) {
            void runTranslationRef.current(nextPending);
          }
        }
      }
    },
    [bookingId, finalizeLine, scheduleTranslationResume],
  );

  useEffect(() => {
    runTranslationRef.current = runTranslation;
  }, [runTranslation]);

  const scheduleTranslation = useCallback(
    (pending: PendingTranslation) => {
      pendingBySegmentRef.current.set(pending.segmentId, pending);

      const admission = admitTranslationRequest(queueRef.current, pending.segmentId);
      queueRef.current = admission.snapshot;

      if (admission.droppedQueuedId) {
        const dropped = pendingBySegmentRef.current.get(admission.droppedQueuedId);
        pendingBySegmentRef.current.delete(admission.droppedQueuedId);
        if (dropped) {
          finalizeDroppedTranslation(dropped);
        } else {
          setLines((prev) =>
            prev.filter(
              (line) =>
                line.id !== admission.droppedQueuedId &&
                line.id !== `${admission.droppedQueuedId}-pending`,
            ),
          );
        }
      }

      if (admission.startNow) {
        void runTranslation(pending);
      }
    },
    [finalizeDroppedTranslation, runTranslation],
  );

  useEffect(() => {
    scheduleTranslationRef.current = scheduleTranslation;
  }, [scheduleTranslation]);

  const handleUtterance = useCallback(
    (raw: TranscriptUtterance) => {
      if (!captionsEnabled || !captionsOn || transcriptionUnavailable) {
        return;
      }

      const [mapped] = mapSpeakersToRoles([raw], {
        mentorUserId: mentorId,
        menteeUserId: menteeId,
        mentorDisplayName: mentorName,
        menteeDisplayName: menteeName,
      });
      const label = resolveSessionSpeakerLabel({
        speakerRole: mapped.speakerRole,
        viewerRole: sessionRole,
        mentorFullName: mentorName,
        menteeFullName: menteeName,
      });
      const direction = resolveCaptionDirection({
        viewerRole: sessionRole,
        menteePreferredLocale,
        detectedLocale: mapped.detectedLocale,
        speakerRole: mapped.speakerRole,
      });

      if (translationPausedRef.current && direction.shouldTranslate) {
        const placeholderId = `${mapped.id}-pending`;
        pausedDuringLimitRef.current = [
          ...pausedDuringLimitRef.current.slice(-7),
          {
            segmentId: mapped.id,
            placeholderId,
            label,
            sourceLocale: direction.sourceLocale,
            targetLocale: direction.targetLocale,
            rawText: mapped.text,
          },
        ];
        pushLine({
          id: placeholderId,
          speakerLabel: label,
          text: mapped.text,
          translated: false,
          loading: false,
          error: false,
        });
        return;
      }

      if (!direction.shouldTranslate) {
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

      const cacheKey = buildTranslationCacheKey(
        direction.sourceLocale,
        direction.targetLocale,
        mapped.text,
      );
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
      pushLine({
        id: placeholderId,
        speakerLabel: label,
        text: mapped.text,
        translated: false,
        loading: true,
        error: false,
      });

      scheduleTranslation({
        segmentId: mapped.id,
        placeholderId,
        label,
        sourceLocale: direction.sourceLocale,
        targetLocale: direction.targetLocale,
        rawText: mapped.text,
      });
    },
    [
      captionsEnabled,
      captionsOn,
      menteeId,
      menteeName,
      menteePreferredLocale,
      mentorId,
      mentorName,
      pushLine,
      scheduleTranslation,
      sessionRole,
      transcriptionUnavailable,
    ],
  );

  return {
    lines: captionsOn ? lines : [],
    captionsOn,
    setCaptionsOn,
    handleUtterance,
    captionsEnabled,
    translationPaused,
    transcriptionUnavailable,
  };
}
