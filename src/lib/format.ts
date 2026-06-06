/**
 * Formats a session instant for display in the viewer's local timezone.
 * Call sites should use suppressHydrationWarning when rendered in SSR + CSR,
 * since server and browser may differ in timezone.
 */
export function formatSessionWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
