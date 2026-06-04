import { describe, expect, it } from 'vitest';
import { parseEarlyAccessReferrer } from './early-access-referrer';

describe('parseEarlyAccessReferrer', () => {
  it('returns ref query param', () => {
    expect(parseEarlyAccessReferrer('?ref=linkedin-jun-2026')).toBe(
      'linkedin-jun-2026',
    );
  });

  it('returns undefined when ref is missing', () => {
    expect(parseEarlyAccessReferrer('?utm_source=newsletter')).toBeUndefined();
    expect(parseEarlyAccessReferrer('')).toBeUndefined();
  });

  it('ignores other params', () => {
    expect(parseEarlyAccessReferrer('?ref=partner-nasa&foo=bar')).toBe(
      'partner-nasa',
    );
  });
});
