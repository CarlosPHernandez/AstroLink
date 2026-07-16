import { describe, expect, it } from 'vitest';
import {
  buildWaitlistLandingRedirect,
  isRetiredEarlyAccessPath,
  WAITLIST_PUBLIC_LANDING_PATH,
} from '@/lib/waitlist/waitlist-landing';

describe('waitlist-landing', () => {
  it('identifies retired early-access paths', () => {
    expect(isRetiredEarlyAccessPath('/early-access')).toBe(true);
    expect(isRetiredEarlyAccessPath('/early-access/player')).toBe(true);
    expect(isRetiredEarlyAccessPath('/talk-with-chris')).toBe(false);
  });

  it('redirects early-access to talk-with-chris with default ref', () => {
    expect(buildWaitlistLandingRedirect('/early-access', '')).toBe(WAITLIST_PUBLIC_LANDING_PATH);
    expect(buildWaitlistLandingRedirect('/early-access', '?ref=linkedin')).toBe(
      '/talk-with-chris?ref=linkedin',
    );
    expect(buildWaitlistLandingRedirect('/early-access', '?ref=early-signups')).toBe(
      '/talk-with-chris?ref=early-signups',
    );
  });
});