/** Max length for waitlist storage (RFC 5321 practical limit). */
export const WAITLIST_EMAIL_MAX_LENGTH = 320;

export const WAITLIST_EMAIL_ERROR = 'Enter a valid email address.';

/**
 * Permissive waitlist email check — accepts non-traditional domains (no TLD required).
 * Still requires local@host shape with no spaces.
 */
export function isPermissiveEmailAddress(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > WAITLIST_EMAIL_MAX_LENGTH) {
    return false;
  }

  const atIndex = normalized.indexOf('@');
  if (atIndex <= 0 || atIndex !== normalized.lastIndexOf('@')) {
    return false;
  }

  const local = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);
  if (!local || !domain) {
    return false;
  }

  if (/\s/.test(normalized) || /[<>]/.test(normalized)) {
    return false;
  }

  return true;
}

export function normalizeWaitlistEmail(value: string): string {
  return value.trim().toLowerCase();
}