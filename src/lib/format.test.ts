import { describe, expect, it } from 'vitest';
import { formatSessionWhen, SESSION_DISPLAY_TIMEZONE } from './format';

function expectedEasternLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: SESSION_DISPLAY_TIMEZONE,
    timeZoneName: 'short',
  }).format(new Date(iso));
}

describe('formatSessionWhen', () => {
  it('always formats in America/New_York (Eastern), not browser local', () => {
    // 19:00 UTC = 3:00 PM Eastern (EDT in July)
    const iso = '2026-07-21T19:00:00.000Z';
    const label = formatSessionWhen(iso);
    expect(label).toBe(expectedEasternLabel(iso));
    expect(label).toMatch(/3:00\s*PM/i);
    expect(label).toMatch(/EDT|EST|GMT-4|GMT-5/);
    expect(label).not.toMatch(/7:00\s*PM/i);
  });

  it('falls back to the raw input on invalid date', () => {
    expect(formatSessionWhen('not-a-date')).toBe('not-a-date');
  });

  it('parses Postgres-style timestamps with space separator into Eastern', () => {
    const iso = '2026-07-21 19:00:00+00';
    const label = formatSessionWhen(iso);
    expect(label).toMatch(/3:00\s*PM/i);
    expect(label).not.toBe(iso);
  });
});
