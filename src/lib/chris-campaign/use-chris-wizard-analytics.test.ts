import { describe, expect, it } from 'vitest';
import { resolveChrisWizardExitOutcome } from '@/lib/chris-campaign/chris-campaign-analytics';

describe('useChrisWizardAnalytics exit outcomes', () => {
  it('documents session-before-auth progress as session_only until checkout', () => {
    expect(
      resolveChrisWizardExitOutcome({
        authSuccess: false,
        sessionContinued: true,
        checkoutStarted: false,
        paid: false,
      }),
    ).toBe('session_only');
  });

  it('classifies session_only when user continued past goals but did not checkout', () => {
    expect(
      resolveChrisWizardExitOutcome({
        authSuccess: true,
        sessionContinued: true,
        checkoutStarted: false,
        paid: false,
      }),
    ).toBe('session_only');
  });

  it('classifies checkout_started when PI created but not paid', () => {
    expect(
      resolveChrisWizardExitOutcome({
        authSuccess: true,
        sessionContinued: true,
        checkoutStarted: true,
        paid: false,
      }),
    ).toBe('checkout_started');
  });
});