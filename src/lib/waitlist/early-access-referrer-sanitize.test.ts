import { describe, expect, it } from 'vitest';
import { sanitizeEarlyAccessReferrer } from './early-access-referrer-sanitize';

describe('sanitizeEarlyAccessReferrer', () => {
  it('accepts taxonomy-style refs', () => {
    expect(sanitizeEarlyAccessReferrer('linkedin-jun-2026')).toBe('linkedin-jun-2026');
    expect(sanitizeEarlyAccessReferrer('expert-david-guajardo')).toBe('expert-david-guajardo');
  });

  it('rejects invalid refs', () => {
    expect(sanitizeEarlyAccessReferrer('<script>')).toBeUndefined();
    expect(sanitizeEarlyAccessReferrer('UPPERCASE')).toBeUndefined();
    expect(sanitizeEarlyAccessReferrer('-leading-hyphen')).toBeUndefined();
    expect(sanitizeEarlyAccessReferrer('')).toBeUndefined();
  });
});