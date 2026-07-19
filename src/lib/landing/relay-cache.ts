import 'server-only';

type CacheEntry = {
  teaser: string;
  cta: string;
  expiresAt: number;
};

const TTL_MS = 20 * 60 * 1000;
const MAX_ENTRIES = 500;

const cache = new Map<string, CacheEntry>();

function normalizeGoal(goal: string): string {
  return goal.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function landingRelayCacheKey(goal: string, expertSlug: string): string {
  return `${normalizeGoal(goal)}::${expertSlug}`;
}

export function getLandingRelayCache(
  goal: string,
  expertSlug: string,
): { teaser: string; cta: string } | null {
  const key = landingRelayCacheKey(goal, expertSlug);
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  // LRU-ish: re-insert to end
  cache.delete(key);
  cache.set(key, entry);
  return { teaser: entry.teaser, cta: entry.cta };
}

export function setLandingRelayCache(
  goal: string,
  expertSlug: string,
  teaser: string,
  cta: string,
): void {
  const key = landingRelayCacheKey(goal, expertSlug);
  while (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
  cache.set(key, {
    teaser,
    cta,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function __resetLandingRelayCacheForTests(): void {
  cache.clear();
}
