import { describe, expect, it } from 'vitest';

import {
  assertGrantApplicable,
  formatGrantExpiryLabel,
  SESSION_COMP_CREDIT_MINUTES,
  type SessionCompGrantView,
} from '@/lib/session-comp-grants';

const grant: SessionCompGrantView = {
  id: 'a0000001-0000-4000-8000-000000000099',
  creditMinutes: 15,
  status: 'available',
  expiresAt: '2030-12-31T00:00:00.000Z',
  eligibleScope: 'any_listed_expert',
};

describe('assertGrantApplicable', () => {
  it('accepts available grant at 15 minutes', () => {
    expect(() =>
      assertGrantApplicable({
        grant,
        menteeId: 'user-1',
        durationMinutes: SESSION_COMP_CREDIT_MINUTES,
      }),
    ).not.toThrow();
  });

  it('rejects non-15-minute duration', () => {
    expect(() =>
      assertGrantApplicable({
        grant,
        menteeId: 'user-1',
        durationMinutes: 30,
      }),
    ).toThrow(/15-minute/i);
  });

  it('rejects expired grant', () => {
    expect(() =>
      assertGrantApplicable({
        grant: { ...grant, expiresAt: '2020-01-01T00:00:00.000Z' },
        menteeId: 'user-1',
        durationMinutes: 15,
        now: new Date('2026-07-23T12:00:00.000Z'),
      }),
    ).toThrow(/expired/i);
  });

  it('rejects non-available status', () => {
    expect(() =>
      assertGrantApplicable({
        grant: { ...grant, status: 'redeemed' },
        menteeId: 'user-1',
        durationMinutes: 15,
      }),
    ).toThrow(/no longer available/i);
  });
});

describe('formatGrantExpiryLabel', () => {
  it('formats expiry or null', () => {
    expect(formatGrantExpiryLabel(null)).toBeNull();
    expect(formatGrantExpiryLabel('2030-12-31T17:00:00.000Z')).toMatch(/2030/);
  });
});
