/**
 * Formats a session instant for display in the viewer's local timezone,
 * with an explicit short timezone label (e.g. EDT) so UTC vs local is not ambiguous.
 * Call sites should use suppressHydrationWarning when rendered in SSR + CSR,
 * since server and browser may differ in timezone.
 */
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
