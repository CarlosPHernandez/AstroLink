export const MAX_IN_FLIGHT_TRANSLATIONS = 6;

export function buildTranslationCacheKey(
  sourceLocale: string,
  targetLocale: string,
  text: string,
): string {
  return `${sourceLocale}:${targetLocale}:${text}`;
}

export type TranslationQueueSnapshot = {
  inFlight: number;
  queuedSegmentIds: string[];
};

/**
 * Admit a new translation request. When at capacity, queue the segment and drop
 * the oldest queued id (in-flight work is never cancelled).
 */
export function admitTranslationRequest(
  snapshot: TranslationQueueSnapshot,
  segmentId: string,
  maxInFlight = MAX_IN_FLIGHT_TRANSLATIONS,
): { snapshot: TranslationQueueSnapshot; droppedQueuedId: string | null; startNow: boolean } {
  if (snapshot.inFlight < maxInFlight) {
    return {
      snapshot: { ...snapshot, inFlight: snapshot.inFlight + 1 },
      droppedQueuedId: null,
      startNow: true,
    };
  }

  const queued = [...snapshot.queuedSegmentIds];
  let droppedQueuedId: string | null = null;
  if (queued.length > 0) {
    droppedQueuedId = queued.shift() ?? null;
  }
  queued.push(segmentId);

  return {
    snapshot: { ...snapshot, queuedSegmentIds: queued },
    droppedQueuedId,
    startNow: false,
  };
}

/** Release an in-flight slot and return the next queued segment id to start, if any. */
export function releaseTranslationSlot(
  snapshot: TranslationQueueSnapshot,
): { snapshot: TranslationQueueSnapshot; nextSegmentId: string | null } {
  if (snapshot.queuedSegmentIds.length > 0) {
    const [nextSegmentId, ...rest] = snapshot.queuedSegmentIds;
    return {
      snapshot: { inFlight: snapshot.inFlight, queuedSegmentIds: rest },
      nextSegmentId: nextSegmentId ?? null,
    };
  }

  return {
    snapshot: {
      inFlight: Math.max(0, snapshot.inFlight - 1),
      queuedSegmentIds: snapshot.queuedSegmentIds,
    },
    nextSegmentId: null,
  };
}

/**
 * After a translation completes, dequeue the next runnable segment.
 * Skips orphaned queue ids (e.g. duplicate speech_id collisions) so in-flight slots are not leaked.
 */
export function dequeueNextTranslationWork(
  snapshot: TranslationQueueSnapshot,
  hasPending: (segmentId: string) => boolean,
): { snapshot: TranslationQueueSnapshot; nextSegmentId: string | null } {
  let current = snapshot;

  while (true) {
    const released = releaseTranslationSlot(current);
    current = released.snapshot;
    const nextId = released.nextSegmentId;
    if (!nextId) {
      return { snapshot: current, nextSegmentId: null };
    }
    if (hasPending(nextId)) {
      return { snapshot: current, nextSegmentId: nextId };
    }
  }
}

export type GracefulTranslationFallbackCode =
  | 'text_too_short'
  | 'same_language'
  | 'budget_exceeded'
  | 'rate_limited';

export function isGracefulTranslationFallback(
  code: string | undefined,
): code is GracefulTranslationFallbackCode {
  return (
    code === 'text_too_short' ||
    code === 'same_language' ||
    code === 'budget_exceeded' ||
    code === 'rate_limited'
  );
}
