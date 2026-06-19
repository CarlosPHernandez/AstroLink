import { describe, expect, it } from 'vitest';
import { getEarlyAccessSuccessDisplay } from './early-access-success';

describe('getEarlyAccessSuccessDisplay', () => {
  it('returns uniform success copy', () => {
    expect(getEarlyAccessSuccessDisplay()).toEqual({
      headline: "You're on the list",
      body: "We'll reach out when early access opens.",
    });
  });
});