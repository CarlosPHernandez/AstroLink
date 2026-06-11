import { describe, expect, it } from 'vitest';

import { splitDailyJoinUrl } from '@/lib/daily-join-url';

describe('splitDailyJoinUrl', () => {
  it('extracts the meeting token and strips it from the room URL', () => {
    const { url, token } = splitDailyJoinUrl(
      'https://astrolink.daily.co/astrolink-abc123?t=eyJhbGciOiJIUzI1NiJ9.payload.sig',
    );
    expect(token).toBe('eyJhbGciOiJIUzI1NiJ9.payload.sig');
    expect(url).toBe('https://astrolink.daily.co/astrolink-abc123');
  });

  it('returns null token when the URL has no t param', () => {
    const { url, token } = splitDailyJoinUrl('https://astrolink.daily.co/astrolink-abc123');
    expect(token).toBeNull();
    expect(url).toBe('https://astrolink.daily.co/astrolink-abc123');
  });

  it('preserves unrelated query params', () => {
    const { url, token } = splitDailyJoinUrl(
      'https://astrolink.daily.co/astrolink-abc123?foo=bar&t=tok123',
    );
    expect(token).toBe('tok123');
    expect(url).toBe('https://astrolink.daily.co/astrolink-abc123?foo=bar');
  });
});
