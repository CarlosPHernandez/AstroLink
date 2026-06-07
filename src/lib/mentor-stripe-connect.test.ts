import { describe, expect, it } from 'vitest';
import { resolveStripeOnboardingMentorUpdate } from '@/lib/mentor-stripe-connect';

describe('resolveStripeOnboardingMentorUpdate', () => {
  it('keeps approved mentors approved when onboarding completes', () => {
    expect(resolveStripeOnboardingMentorUpdate('approved', true)).toEqual({
      stripe_onboarding_completed: true,
    });
  });

  it('moves unapproved mentors to awaiting_human_approval when onboarding completes', () => {
    expect(resolveStripeOnboardingMentorUpdate('stripe_incomplete', true)).toEqual({
      stripe_onboarding_completed: true,
      compliance_status: 'awaiting_human_approval',
    });
  });

  it('does not downgrade approved mentors when onboarding is incomplete', () => {
    expect(resolveStripeOnboardingMentorUpdate('approved', false)).toEqual({
      stripe_onboarding_completed: false,
    });
  });

  it('marks unapproved mentors stripe_incomplete when onboarding is incomplete', () => {
    expect(resolveStripeOnboardingMentorUpdate('document_required', false)).toEqual({
      stripe_onboarding_completed: false,
      compliance_status: 'stripe_incomplete',
    });
  });
});
