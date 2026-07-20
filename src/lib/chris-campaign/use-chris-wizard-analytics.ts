'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  dwellBucket,
  resolveChrisWizardExitOutcome,
  trackChrisWizardExit,
  type ChrisAuthMode,
  type ChrisWizardProgress,
  type ChrisWizardStep,
} from '@/lib/chris-campaign/chris-campaign-analytics';

type UseChrisWizardAnalyticsOptions = {
  marketingReferrer: string | null;
};

export type ChrisWizardAnalyticsReporter = {
  reportAuthSuccess: (mode: ChrisAuthMode) => void;
  reportSessionContinue: () => void;
  reportCheckoutStart: () => void;
  reportPaid: () => void;
  reportLastStep: (step: ChrisWizardStep) => void;
};

export function useChrisWizardAnalytics({
  marketingReferrer,
}: UseChrisWizardAnalyticsOptions): ChrisWizardAnalyticsReporter {
  const mountedAtRef = useRef(0);
  const sentExitRef = useRef(false);
  const lastStepRef = useRef<ChrisWizardStep>('session');
  const progressRef = useRef<ChrisWizardProgress>({
    authSuccess: false,
    sessionContinued: false,
    checkoutStarted: false,
    paid: false,
  });

  const sendExit = useCallback(() => {
    if (sentExitRef.current) return;
    sentExitRef.current = true;

    const mountedAt = mountedAtRef.current || Date.now();
    const dwell = dwellBucket(Date.now() - mountedAt);
    const outcome = resolveChrisWizardExitOutcome(progressRef.current);

    trackChrisWizardExit(
      marketingReferrer,
      lastStepRef.current,
      dwell,
      outcome,
    );
  }, [marketingReferrer]);

  useEffect(() => {
    mountedAtRef.current = Date.now();

    const onExit = () => {
      sendExit();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        onExit();
      }
    };

    window.addEventListener('pagehide', onExit);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', onExit);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [sendExit]);

  const reportAuthSuccess = useCallback((mode: ChrisAuthMode) => {
    progressRef.current.authSuccess = true;
    // Goals-first: after auth, user resumes toward payment (wizard sets step).
    lastStepRef.current = 'payment';
    void mode;
  }, []);

  const reportSessionContinue = useCallback(() => {
    progressRef.current.sessionContinued = true;
    lastStepRef.current = 'payment';
  }, []);

  const reportCheckoutStart = useCallback(() => {
    progressRef.current.checkoutStarted = true;
    lastStepRef.current = 'stripe';
  }, []);

  const reportPaid = useCallback(() => {
    progressRef.current.paid = true;
    sentExitRef.current = true;
  }, []);

  const reportLastStep = useCallback((step: ChrisWizardStep) => {
    lastStepRef.current = step;
  }, []);

  return {
    reportAuthSuccess,
    reportSessionContinue,
    reportCheckoutStart,
    reportPaid,
    reportLastStep,
  };
}