import { describe, expect, it } from 'vitest';
import { formatSessionWhen } from './format';

function expectedLocalLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(iso));
}

describe('formatSessionWhen', () => {
  it('formats using the runtime local timezone with a short zone label', () => {
    const iso = '2026-06-10T12:35:00.000Z';
    const label = formatSessionWhen(iso);
    expect(label).toBe(expectedLocalLabel(iso));
    // Zone abbreviation present (e.g. EDT, PDT, GMT+2) — avoids bare UTC-hour confusion
    expect(label).toMatch(/[A-Za-z]{2,}|GMT|UTC/);
  });

  it('falls back to the raw input on invalid date', () => {
    expect(formatSessionWhen('not-a-date')).toBe('not-a-date');
  });

  it('parses Postgres-style timestamps with space separator', () => {
    const iso = '2026-07-21 15:20:00+00';
    const label = formatSessionWhen(iso);
    expect(label).not.toBe(iso);
    expect(label.length).toBeGreaterThan(8);
  });
});
