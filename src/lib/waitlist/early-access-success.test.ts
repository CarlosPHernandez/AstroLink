import { describe, expect, it } from 'vitest';
import { getEarlyAccessSuccessDisplay } from './early-access-success';

describe('getEarlyAccessSuccessDisplay', () => {
  it('returns new-signup copy', () => {
    expect(getEarlyAccessSuccessDisplay(false)).toEqual({
      headline: "You're on the list",
      body: "We'll reach out when early access opens.",
    });
  });

  it('returns duplicate-signup copy', () => {
    expect(getEarlyAccessSuccessDisplay(true)).toEqual({
      headline: "You're already on the list",
      body: 'We have your email—no need to sign up again.',
    });
  });
});