/**
 * Client-only Chris booking draft (localStorage).
 * Goals text can be sensitive — 48h TTL, clear on successful payment.
 */
import { CHRIS_GOALS_MIN_CHARS } from '@/lib/chris-campaign/chris-campaign-constants';

export const CHRIS_BOOKING_DRAFT_KEY = 'astrolink:chris-booking-draft:v1';
export const CHRIS_BOOKING_DRAFT_TTL_MS = 48 * 60 * 60 * 1000;

export type ChrisBookingDraft = {
  goals: string;
  background: string;
  durationMinutes: number;
  scheduledAt: string;
  date: string | null;
  marketingReferrer: string | null;
  updatedAt: number;
};

function emptyDraft(now: number): ChrisBookingDraft {
  return {
    goals: '',
    background: '',
    durationMinutes: 45,
    scheduledAt: '',
    date: null,
    marketingReferrer: null,
    updatedAt: now,
  };
}

export function isDraftExpired(
  draft: { updatedAt: number },
  now: number = Date.now(),
): boolean {
  return now - draft.updatedAt > CHRIS_BOOKING_DRAFT_TTL_MS;
}

/** Prefer globalThis so vitest `stubGlobal('localStorage')` and browsers both work. */
function getLocalStorage(): Storage | null {
  try {
    if (typeof globalThis.localStorage === 'undefined' || globalThis.localStorage == null) {
      return null;
    }
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function loadDraft(): ChrisBookingDraft | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(CHRIS_BOOKING_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ChrisBookingDraft>;
    if (typeof parsed.updatedAt !== 'number') {
      clearDraft();
      return null;
    }
    if (isDraftExpired({ updatedAt: parsed.updatedAt })) {
      clearDraft();
      return null;
    }
    return {
      goals: typeof parsed.goals === 'string' ? parsed.goals : '',
      background: typeof parsed.background === 'string' ? parsed.background : '',
      durationMinutes:
        typeof parsed.durationMinutes === 'number' ? parsed.durationMinutes : 45,
      scheduledAt: typeof parsed.scheduledAt === 'string' ? parsed.scheduledAt : '',
      date: typeof parsed.date === 'string' ? parsed.date : null,
      marketingReferrer:
        typeof parsed.marketingReferrer === 'string' ? parsed.marketingReferrer : null,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    clearDraft();
    return null;
  }
}

export function saveDraft(
  partial: Partial<Omit<ChrisBookingDraft, 'updatedAt'>>,
): ChrisBookingDraft | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  const now = Date.now();
  const prev = loadDraft() ?? emptyDraft(now);
  const next: ChrisBookingDraft = {
    ...prev,
    ...partial,
    updatedAt: now,
  };
  try {
    storage.setItem(CHRIS_BOOKING_DRAFT_KEY, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(CHRIS_BOOKING_DRAFT_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function isChrisDraftSessionComplete(
  draft: Pick<ChrisBookingDraft, 'goals' | 'durationMinutes' | 'scheduledAt'>,
  goalsMin: number = CHRIS_GOALS_MIN_CHARS,
): boolean {
  const goals = draft.goals.trim();
  return (
    goals.length >= goalsMin &&
    Number.isFinite(draft.durationMinutes) &&
    draft.durationMinutes > 0 &&
    draft.scheduledAt.trim().length > 0
  );
}
