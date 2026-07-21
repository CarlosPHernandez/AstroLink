import { describe, expect, it } from 'vitest';

import {
  ActivationPasswordSchema,
  ActivationProfileSchema,
  ChangeMentorPasswordSchema,
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

describe('ActivationPasswordSchema', () => {
  it('accepts matching passwords of at least 8 characters', () => {
    const result = ActivationPasswordSchema.safeParse({
      password: 'securepass',
      confirmPassword: 'securepass',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short passwords', () => {
    const result = ActivationPasswordSchema.safeParse({
      password: 'short',
      confirmPassword: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password?.[0]).toMatch(/8 characters/i);
    }
  });

  it('rejects mismatched confirmation', () => {
    const result = ActivationPasswordSchema.safeParse({
      password: 'securepass',
      confirmPassword: 'different1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword?.[0]).toMatch(/do not match/i);
    }
  });
});

describe('ChangeMentorPasswordSchema', () => {
  it('accepts a valid password change', () => {
    const result = ChangeMentorPasswordSchema.safeParse({
      currentPassword: 'oldpassword',
      password: 'newpassword',
      confirmPassword: 'newpassword',
    });
    expect(result.success).toBe(true);
  });

  it('requires current password', () => {
    const result = ChangeMentorPasswordSchema.safeParse({
      currentPassword: '',
      password: 'newpassword',
      confirmPassword: 'newpassword',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.currentPassword?.[0]).toBeTruthy();
    }
  });

  it('rejects new password identical to current', () => {
    const result = ChangeMentorPasswordSchema.safeParse({
      currentPassword: 'samepass1',
      password: 'samepass1',
      confirmPassword: 'samepass1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password?.[0]).toMatch(/different/i);
    }
  });
});
