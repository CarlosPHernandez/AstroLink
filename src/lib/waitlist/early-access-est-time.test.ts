import { describe, expect, it } from 'vitest';
import { formatEarlyAccessEstTime } from '@/lib/waitlist/early-access-est-time';

describe('formatEarlyAccessEstTime', () => {
  it('formats UTC instants in America/New_York for ops canvases', () => {
    expect(formatEarlyAccessEstTime(new Date('2026-06-19T08:58:34.401861+00:00'))).toBe(
      'Jun 19, 2026 at 04:58 AM ET',
    );
  });
});