/** Kebab-case marketing referrer ids — see docs/how-to/marketing-referrer-taxonomy.md */
const REFERRER_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/;
const MAX_REFERRER_LENGTH = 100;

/**
 * Returns a normalized referrer id or undefined when invalid (store null in DB).
 */
export function sanitizeEarlyAccessReferrer(referrer: string | undefined): string | undefined {
  if (!referrer?.trim()) {
    return undefined;
  }
  const trimmed = referrer.trim().slice(0, MAX_REFERRER_LENGTH);
  if (!REFERRER_PATTERN.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}