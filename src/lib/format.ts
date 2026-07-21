/**
 * Formats a session instant for display in US Eastern time (America/New_York),
 * with a short zone label (EST/EDT). Does not use the browser timezone so
 * machines set to UTC still show Eastern for ops/experts/mentees.
 */

/** Canonical display zone for AstroLink session times. */
export const SESSION_DISPLAY_TIMEZONE = 'America/New_York';

function parseSessionInstant(iso: string): Date {
  let s = iso.trim();
  // Postgres often returns "2026-07-21 15:20:00+00" — normalize for Date.parse.
  if (!s.includes('T') && /\d{4}-\d{2}-\d{2} /.test(s)) {
    s = s.replace(' ', 'T');
  }
  // "+00" / "-05" → "+00:00" / "-05:00"
  s = s.replace(/([+-]\d{2})$/, '$1:00');
  return new Date(s);
}

export function formatSessionWhen(iso: string): string {
  try {
    const date = parseSessionInstant(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: SESSION_DISPLAY_TIMEZONE,
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return iso;
  }
}

/** USD display from integer cents. */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
