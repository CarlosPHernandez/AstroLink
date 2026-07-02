import { describe, expect, it } from 'vitest';
import { isPermissiveEmailAddress, normalizeWaitlistEmail } from './permissive-email';

describe('isPermissiveEmailAddress', () => {
  it('accepts standard emails', () => {
    expect(isPermissiveEmailAddress('user@example.com')).toBe(true);
  });

  it('accepts non-traditional domains without a TLD dot', () => {
    expect(isPermissiveEmailAddress('waitlist@invalid')).toBe(true);
    expect(isPermissiveEmailAddress('ops@company')).toBe(true);
  });

  it('accepts plus tags and subdomains', () => {
    expect(isPermissiveEmailAddress('user+launch@mail.company.co')).toBe(true);
  });

  it('rejects values without @', () => {
    expect(isPermissiveEmailAddress('not-an-email')).toBe(false);
  });

  it('rejects missing local or domain parts', () => {
    expect(isPermissiveEmailAddress('@example.com')).toBe(false);
    expect(isPermissiveEmailAddress('user@')).toBe(false);
  });
});

describe('normalizeWaitlistEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeWaitlistEmail('  Test@Example.COM  ')).toBe('test@example.com');
  });
});