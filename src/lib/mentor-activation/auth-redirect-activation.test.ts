import { describe, expect, it } from 'vitest';

import {
  getDefaultPathAfterAuth,
  isActivationClaimNextPath,
} from '@/lib/auth-redirect';

describe('activation claim redirects', () => {
  it('detects claim complete next paths', () => {
    expect(isActivationClaimNextPath('/activate/complete')).toBe(true);
    expect(
      isActivationClaimNextPath('/activate/complete?token=abc'),
    ).toBe(true);
    expect(isActivationClaimNextPath('/activate/setup')).toBe(false);
    expect(isActivationClaimNextPath('/dashboard/mentor')).toBe(false);
  });

  it('sends pending mentors to activation wizard', () => {
    expect(
      getDefaultPathAfterAuth({
        role: 'mentor',
        onboarded: true,
        activationStatus: 'pending',
      }),
    ).toBe('/activate/setup');
  });

  it('sends active mentors to dashboard', () => {
    expect(
      getDefaultPathAfterAuth({
        role: 'mentor',
        onboarded: true,
        activationStatus: 'active',
      }),
    ).toBe('/dashboard/mentor');
  });
});
