'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { parseEarlyAccessReferrer } from '@/lib/waitlist/early-access-referrer';
import {
  dwellBucket,
  sanitizeWaitlistRef,
  trackWaitlistFormAbandon,
  trackWaitlistPageExit,
  type WaitlistAnalyticsContext,
  type WaitlistFormStartVia,
  type WaitlistPage,
  type WaitlistPageExitOutcome,
  type WaitlistSubmitFailReason,
} from '@/lib/waitlist/waitlist-analytics';

type UseWaitlistPageAnalyticsOptions = {
  page: WaitlistPage;
  defaultReferrer?: string;
  expert?: string;
};

type FormProgress = {
  formViewed: boolean;
  formStarted: boolean;
  hadTyped: boolean;
  submitAttempted: boolean;
  submitFailed: boolean;
  signedUp: boolean;
  lastFailReason?: WaitlistSubmitFailReason;
};

function resolvePageExitOutcome(progress: FormProgress): WaitlistPageExitOutcome {
  if (progress.signedUp) return 'signed_up';
  if (progress.submitFailed) return 'submitted_fail';
  if (progress.formStarted) return 'started_form';
  if (progress.formViewed) return 'viewed_only';
  return 'bounce';
}

export type WaitlistFormAnalytics = {
  context: WaitlistAnalyticsContext;
  reportFormView: () => void;
  reportFormStart: (via: WaitlistFormStartVia) => void;
  reportHadTyped: () => void;
  reportSubmitAttempt: () => void;
  reportSubmitSuccess: () => void;
  reportSubmitFail: (reason: WaitlistSubmitFailReason) => void;
};

export function useWaitlistPageAnalytics({
  page,
  defaultReferrer,
  expert,
}: UseWaitlistPageAnalyticsOptions): WaitlistFormAnalytics {
  const mountedAtRef = useRef<number>(Date.now());
  const sentExitRef = useRef(false);
  const sentAbandonRef = useRef(false);
  const progressRef = useRef<FormProgress>({
    formViewed: false,
    formStarted: false,
    hadTyped: false,
    submitAttempted: false,
    submitFailed: false,
    signedUp: false,
  });

  const context = useMemo<WaitlistAnalyticsContext>(() => {
    const refFromUrl =
      typeof window !== 'undefined'
        ? parseEarlyAccessReferrer(window.location.search)
        : undefined;
    const ref = sanitizeWaitlistRef(refFromUrl ?? defaultReferrer);
    return expert ? { page, ref, expert } : { page, ref };
  }, [page, defaultReferrer, expert]);

  const sendExitEvents = useCallback(() => {
    if (sentExitRef.current) return;
    sentExitRef.current = true;

    const progress = progressRef.current;
    const dwell = dwellBucket(Date.now() - mountedAtRef.current);
    const outcome = resolvePageExitOutcome(progress);

    if (progress.formStarted && !progress.signedUp && !sentAbandonRef.current) {
      sentAbandonRef.current = true;
      trackWaitlistFormAbandon(context, progress.hadTyped, progress.lastFailReason);
    }

    trackWaitlistPageExit(context, dwell, outcome);
  }, [context]);

  useEffect(() => {
    mountedAtRef.current = Date.now();

    const onExit = () => {
      sendExitEvents();
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
  }, [sendExitEvents]);

  const reportFormView = useCallback(() => {
    progressRef.current.formViewed = true;
  }, []);

  const reportFormStart = useCallback((via: WaitlistFormStartVia) => {
    if (progressRef.current.formStarted) return;
    progressRef.current.formStarted = true;
    if (via === 'input') {
      progressRef.current.hadTyped = true;
    }
  }, []);

  const reportHadTyped = useCallback(() => {
    progressRef.current.hadTyped = true;
  }, []);

  const reportSubmitAttempt = useCallback(() => {
    progressRef.current.submitAttempted = true;
  }, []);

  const reportSubmitSuccess = useCallback(() => {
    progressRef.current.signedUp = true;
  }, []);

  const reportSubmitFail = useCallback((reason: WaitlistSubmitFailReason) => {
    progressRef.current.submitAttempted = true;
    progressRef.current.submitFailed = true;
    progressRef.current.lastFailReason = reason;
  }, []);

  return useMemo(
    () => ({
      context,
      reportFormView,
      reportFormStart,
      reportHadTyped,
      reportSubmitAttempt,
      reportSubmitSuccess,
      reportSubmitFail,
    }),
    [
      context,
      reportFormView,
      reportFormStart,
      reportHadTyped,
      reportSubmitAttempt,
      reportSubmitSuccess,
      reportSubmitFail,
    ],
  );
}