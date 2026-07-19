import { describe, expect, it } from 'vitest';
import { formatEasternTime } from '@/lib/format-eastern-time';

describe('formatEasternTime', () => {
  it('formats UTC instants in America/New_York (12-hour clock)', () => {
    expect(formatEasternTime(new Date('2026-06-19T08:58:34.401861+00:00'))).toBe(
      'Jun 19, 2026 at 04:58 AM ET',
    );
  });
});
