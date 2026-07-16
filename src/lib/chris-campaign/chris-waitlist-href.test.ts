import { describe, expect, it } from 'vitest';
import { getChrisWaitlistHref } from '@/lib/chris-campaign/chris-waitlist-href';
import { CHRIS_PUBLIC_REFERRER } from '@/lib/chris-campaign/chris-campaign-referrer';

describe('chris-waitlist-href', () => {
  it('builds early-access link with encoded ref', () => {
    expect(getChrisWaitlistHref(CHRIS_PUBLIC_REFERRER)).toBe(
      '/talk-with-chris?ref=chris-sembroski',
    );
  });
});
