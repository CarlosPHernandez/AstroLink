import { describe, expect, it } from 'vitest';
import { formatSessionWhen } from './format';

function expectedLocalLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

describe('formatSessionWhen', () => {
  it('formats using the runtime local timezone (en-US style)', () => {
    // Display is intentionally local wall time for UX (matches datetime-local booking input).
    // SSR/CSR may differ; call sites use suppressHydrationWarning on the rendered element.
    const iso = '2026-06-10T12:35:00.000Z';
    expect(formatSessionWhen(iso)).toBe(expectedLocalLabel(iso));
  });

  it('falls back to the raw input on invalid date', () => {
    expect(formatSessionWhen('not-a-date')).toBe('not-a-date');
  });

  it('handles another timestamp in local time', () => {
    const iso = '2026-06-04T20:33:00.000Z';
    expect(formatSessionWhen(iso)).toBe(expectedLocalLabel(iso));
  });
});
