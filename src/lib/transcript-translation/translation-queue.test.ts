import { describe, expect, it } from 'vitest';

import {
  admitTranslationRequest,
  buildTranslationCacheKey,
  dequeueNextTranslationWork,
  isGracefulTranslationFallback,
  releaseTranslationSlot,
} from '@/lib/transcript-translation/translation-queue';

describe('buildTranslationCacheKey', () => {
  it('includes sourceLocale so es→en and en→es do not collide', () => {
    const esToEn = buildTranslationCacheKey('es', 'en', 'hospital');
    const enToEs = buildTranslationCacheKey('en', 'es', 'hospital');
    expect(esToEn).not.toBe(enToEs);
  });
});

describe('admitTranslationRequest', () => {
  it('starts immediately when under the in-flight cap', () => {
    const result = admitTranslationRequest({ inFlight: 1, queuedSegmentIds: [] }, 'seg-a');
    expect(result.startNow).toBe(true);
    expect(result.snapshot.inFlight).toBe(2);
    expect(result.droppedQueuedId).toBeNull();
  });

  it('queues newest and drops oldest queued when at capacity', () => {
    const atCapacity = { inFlight: 3, queuedSegmentIds: ['old-queued'] };
    const result = admitTranslationRequest(atCapacity, 'new-seg');
    expect(result.startNow).toBe(false);
    expect(result.droppedQueuedId).toBe('old-queued');
    expect(result.snapshot.queuedSegmentIds).toEqual(['new-seg']);
    expect(result.snapshot.inFlight).toBe(3);
  });
});

describe('releaseTranslationSlot', () => {
  it('hands off to the next queued segment without lowering in-flight count', () => {
    const released = releaseTranslationSlot({
      inFlight: 3,
      queuedSegmentIds: ['next-seg'],
    });
    expect(released.nextSegmentId).toBe('next-seg');
    expect(released.snapshot.inFlight).toBe(3);
    expect(released.snapshot.queuedSegmentIds).toEqual([]);
  });

  it('decrements in-flight when the queue is empty', () => {
    const released = releaseTranslationSlot({ inFlight: 2, queuedSegmentIds: [] });
    expect(released.nextSegmentId).toBeNull();
    expect(released.snapshot.inFlight).toBe(1);
  });
});

describe('dequeueNextTranslationWork', () => {
  it('skips orphaned queue ids and decrements in-flight when no pending work remains', () => {
    const handoff = dequeueNextTranslationWork(
      { inFlight: 3, queuedSegmentIds: ['orphan-seg', 'real-seg'] },
      (id) => id === 'real-seg',
    );
    expect(handoff.nextSegmentId).toBe('real-seg');
    expect(handoff.snapshot.inFlight).toBe(3);
    expect(handoff.snapshot.queuedSegmentIds).toEqual([]);
  });

  it('releases the in-flight slot when every queued id is orphaned', () => {
    const handoff = dequeueNextTranslationWork(
      { inFlight: 2, queuedSegmentIds: ['missing-a', 'missing-b'] },
      () => false,
    );
    expect(handoff.nextSegmentId).toBeNull();
    expect(handoff.snapshot.inFlight).toBe(1);
    expect(handoff.snapshot.queuedSegmentIds).toEqual([]);
  });
});

describe('isGracefulTranslationFallback', () => {
  it('treats budget_exceeded as silent raw-text fallback', () => {
    expect(isGracefulTranslationFallback('budget_exceeded')).toBe(true);
    expect(isGracefulTranslationFallback('text_too_short')).toBe(true);
    expect(isGracefulTranslationFallback('same_language')).toBe(true);
    expect(isGracefulTranslationFallback('rate_limited')).toBe(true);
    expect(isGracefulTranslationFallback('other')).toBe(false);
  });
});
