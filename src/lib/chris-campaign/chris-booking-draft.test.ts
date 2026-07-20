import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHRIS_BOOKING_DRAFT_KEY,
  CHRIS_BOOKING_DRAFT_TTL_MS,
  clearDraft,
  isChrisDraftSessionComplete,
  isDraftExpired,
  loadDraft,
  saveDraft,
} from '@/lib/chris-campaign/chris-booking-draft';
import { CHRIS_GOALS_MIN_CHARS } from '@/lib/chris-campaign/chris-campaign-constants';

describe('chris-booking-draft', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('saveDraft + loadDraft round-trips fields and sets updatedAt', () => {
    const saved = saveDraft({
      goals: 'I want launch strategy advice for my STEM nonprofit program.',
      background: '',
      durationMinutes: 45,
      scheduledAt: '2030-08-15T12:00',
      date: '2030-08-15',
      marketingReferrer: 'chris-sembroski',
    });
    expect(saved?.goals).toContain('STEM');
    expect(saved?.updatedAt).toBeTypeOf('number');
    expect(loadDraft()?.goals).toBe(saved?.goals);
    expect(localStorage.getItem(CHRIS_BOOKING_DRAFT_KEY)).toBeTruthy();
  });

  it('loadDraft returns null and clears key when expired', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    saveDraft({ goals: 'enough characters for a real chris booking goal text here' });
    vi.setSystemTime(new Date(Date.now() + CHRIS_BOOKING_DRAFT_TTL_MS + 1));
    expect(loadDraft()).toBeNull();
    expect(localStorage.getItem(CHRIS_BOOKING_DRAFT_KEY)).toBeNull();
  });

  it('loadDraft returns null on corrupt JSON', () => {
    localStorage.setItem(CHRIS_BOOKING_DRAFT_KEY, '{not-json');
    expect(loadDraft()).toBeNull();
  });

  it('clearDraft removes the key', () => {
    saveDraft({ goals: 'enough characters for a real chris booking goal text here' });
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it('isDraftExpired is true after TTL', () => {
    const now = 1_000_000;
    expect(isDraftExpired({ updatedAt: now - CHRIS_BOOKING_DRAFT_TTL_MS - 1 }, now)).toBe(
      true,
    );
    expect(isDraftExpired({ updatedAt: now - 1000 }, now)).toBe(false);
  });

  it('isChrisDraftSessionComplete requires goals floor', () => {
    expect(
      isChrisDraftSessionComplete({
        goals: 'short',
        durationMinutes: 45,
        scheduledAt: '2030-08-15T12:00',
      }),
    ).toBe(false);
    expect(
      isChrisDraftSessionComplete({
        goals: 'x'.repeat(CHRIS_GOALS_MIN_CHARS),
        durationMinutes: 45,
        scheduledAt: '2030-08-15T12:00',
      }),
    ).toBe(true);
  });
});
