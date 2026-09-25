import { describe, expect, it } from 'vitest';
import { isPendingMentorPathAllowed } from '@/proxy';

describe('isPendingMentorPathAllowed', () => {
  it('allows the offer API and the activation wizard only', () => {
    expect(isPendingMentorPathAllowed('/api/mentor/offer')).toBe(true);
    expect(isPendingMentorPathAllowed('/activate/setup')).toBe(true);
    expect(isPendingMentorPathAllowed('/api/mentor/stripe-connect')).toBe(false);
    expect(isPendingMentorPathAllowed('/dashboard/mentor')).toBe(false);
  });
});
