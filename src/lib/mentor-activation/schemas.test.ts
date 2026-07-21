import { describe, expect, it } from 'vitest';

import {
  ActivationProfileSchema,
  InviteMentorBodySchema,
  parseExpertiseList,
  PayoutPreferenceSchema,
} from '@/lib/mentor-activation/schemas';

describe('mentor activation schemas', () => {
  it('accepts invite body', () => {
    const parsed = InviteMentorBodySchema.safeParse({
      email: 'chris@example.com',
      expiresInHours: 48,
    });
    expect(parsed.success).toBe(true);
  });

  it('parses expertise list', () => {
    expect(parseExpertiseList('  A, B , , C ')).toEqual(['A', 'B', 'C']);
  });

  it('requires payout handle for digital methods', () => {
    const bad = PayoutPreferenceSchema.safeParse({
      payoutMethod: 'paypal',
      payoutHandle: '',
    });
    expect(bad.success).toBe(false);

    const good = PayoutPreferenceSchema.safeParse({
      payoutMethod: 'paypal',
      payoutHandle: 'pay@example.com',
    });
    expect(good.success).toBe(true);

    const bank = PayoutPreferenceSchema.safeParse({
      payoutMethod: 'bank_manual',
      payoutHandle: '',
    });
    expect(bank.success).toBe(true);
  });

  it('validates profile fields', () => {
    const parsed = ActivationProfileSchema.safeParse({
      fullName: 'Chris Sembroski',
      title: 'Astronaut',
      employer: 'Inspiration4',
      expertise: 'Flight mechanics, payloads',
      bio: 'Commercial astronaut and aerospace engineer.',
      rate: 320,
    });
    expect(parsed.success).toBe(true);
  });
});
