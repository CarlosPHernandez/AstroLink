'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { ChrisFulfillmentOverlayPhase } from '@/components/chris-campaign/chris-booking-fulfillment-overlay';
import type { BriefingPayload } from '@/lib/briefing-display';
import { BRIEFING_THINKING_STEPS, briefingContentReady } from '@/lib/briefing-display';
import type { BookingStatus } from '@/lib/types';

const PHASE_DELAY_MS = 400;
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 60_000;
const MAX_PAYMENT_CONFIRM_ATTEMPTS = 6;
const PAYMENT_CONFIRM_RETRY_DELAYS_MS = [0, 1500, 3000, 5000, 8000, 13000] as const;

type BookingStatusResponse = {
  success?: boolean;
  error?: string;
  data?: {
    bookingId: string;
    status: BookingStatus;
    scheduledAt: string;
    mentorName: string;
    briefing: BriefingPayload | null;
  };
};

type ConfirmPaymentResponse = {
  success?: boolean;
  error?: string;
};

type ConfirmPaymentResult =
  | { state: 'confirmed' }
  | { state: 'retry'; message?: string }
  | { state: 'fatal'; message: string };

export function classifyConfirmPaymentFailure(
  status: number,
  message?: string,
): ConfirmPaymentResult {
  const fallbackMessage = message || 'Could not confirm payment yet.';

  if (status === 409 && /not confirmed yet/i.test(fallbackMessage)) {
    return { state: 'retry', message: fallbackMessage };
  }

  if (status >= 500 || status === 0) {
    return { state: 'retry', message: fallbackMessage };
  }

  return { state: 'fatal', message: fallbackMessage };
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export type ChrisFulfillmentView = 'wizard' | 'brief' | 'next_steps';

export function useChrisBookingFulfillment() {
  const [view, setView] = useState<ChrisFulfillmentView>('wizard');
  const [overlayPhase, setOverlayPhase] = useState<ChrisFulfillmentOverlayPhase | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [mentorName, setMentorName] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [briefing, setBriefing] = useState<BriefingPayload | null>(null);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const paymentConfirmAttemptsRef = useRef(0);
  const paymentConfirmInFlightRef = useRef(false);
  const nextPaymentConfirmAtRef = useRef(0);
  const briefingAttemptedRef = useRef(false);
  const activeRef = useRef(false);

  useEffect(() => {
    if (overlayPhase !== 'generating_brief') {
      const frame = window.requestAnimationFrame(() => setThinkingStep(0));
      return () => window.cancelAnimationFrame(frame);
    }

    const frame = window.requestAnimationFrame(() => setThinkingStep(0));
    const interval = window.setInterval(() => {
      setThinkingStep((index) => (index + 1) % BRIEFING_THINKING_STEPS.length);
    }, 2200);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, [overlayPhase]);

  const pollBookingStatus = useCallback(async (id: string): Promise<BookingStatusResponse['data'] | null> => {
    const res = await fetch(`/api/bookings/${id}/status`);
    const json = (await res.json()) as BookingStatusResponse;
    if (!res.ok || !json.success || !json.data) {
      return null;
    }
    return json.data;
  }, []);

  const tryConfirmPayment = useCallback(async (id: string): Promise<ConfirmPaymentResult> => {
    if (paymentConfirmInFlightRef.current) {
      return { state: 'retry' };
    }

    const now = Date.now();
    if (now < nextPaymentConfirmAtRef.current) {
      return { state: 'retry' };
    }

    const attempt = paymentConfirmAttemptsRef.current;
    if (attempt >= MAX_PAYMENT_CONFIRM_ATTEMPTS) {
      return {
        state: 'fatal',
        message: 'Payment confirmation is taking longer than expected. You can view your dashboard and try again.',
      };
    }

    paymentConfirmAttemptsRef.current = attempt + 1;
    const retryDelay =
      PAYMENT_CONFIRM_RETRY_DELAYS_MS[
        Math.min(attempt + 1, PAYMENT_CONFIRM_RETRY_DELAYS_MS.length - 1)
      ];
    nextPaymentConfirmAtRef.current = now + retryDelay;
    paymentConfirmInFlightRef.current = true;

    try {
      const res = await fetch(`/api/bookings/${id}/confirm-payment`, {
        method: 'POST',
      });
      const json = (await res.json().catch(() => null)) as ConfirmPaymentResponse | null;

      if (res.ok && json?.success) {
        return { state: 'confirmed' };
      }

      if (!json) {
        return {
          state: 'fatal',
          message: 'Payment confirmation returned an unreadable response. Please open your dashboard.',
        };
      }

      return classifyConfirmPaymentFailure(res.status, json.error);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error confirming payment.';
      return classifyConfirmPaymentFailure(0, message);
    } finally {
      paymentConfirmInFlightRef.current = false;
    }
  }, []);

  const tryGenerateBriefing = useCallback(async (id: string): Promise<BriefingPayload | null> => {
    if (briefingAttemptedRef.current) {
      return null;
    }
    briefingAttemptedRef.current = true;

    const res = await fetch('/api/book/briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: id }),
    });
    const json = (await res.json()) as { success?: boolean; data?: { briefing: BriefingPayload } };
    if (!res.ok || !json.success || !json.data?.briefing) {
      return null;
    }
    return json.data.briefing;
  }, []);

  /** Show segment progress immediately when the user taps Pay. */
  const beginPaymentOverlay = useCallback((id?: string) => {
    flushSync(() => {
      activeRef.current = true;
      if (id) {
        setBookingId(id);
      }
      setView('wizard');
      setBriefing(null);
      setErrorMessage(null);
      setOverlayPhase('authorizing');
    });
  }, []);

  const dismissOverlay = useCallback(() => {
    setOverlayPhase(null);
  }, []);

  const pollUntilBriefReady = useCallback(
    async (id: string) => {
      const startedAt = Date.now();

      while (activeRef.current && Date.now() - startedAt < POLL_TIMEOUT_MS) {
        const status = await pollBookingStatus(id);

        if (!status) {
          await delay(POLL_INTERVAL_MS);
          continue;
        }

        setMentorName(status.mentorName);
        setScheduledAt(status.scheduledAt);

        if (status.status === 'pending_payment') {
          const confirmResult = await tryConfirmPayment(id);
          if (confirmResult.state === 'fatal') {
            setOverlayPhase('error');
            setErrorMessage(confirmResult.message);
            return;
          }
          await delay(POLL_INTERVAL_MS);
          continue;
        }

        let readyBriefing = status.briefing;
        if (
          status.status === 'confirmed' &&
          (!readyBriefing || !briefingContentReady(readyBriefing, 'mentee'))
        ) {
          readyBriefing = await tryGenerateBriefing(id);
        }

        if (readyBriefing && briefingContentReady(readyBriefing, 'mentee')) {
          setBriefing(readyBriefing);
          setOverlayPhase(null);
          setView('brief');
          return;
        }

        await delay(POLL_INTERVAL_MS);
      }

      setOverlayPhase('error');
      setErrorMessage(
        'Your brief is taking longer than expected. You can view your dashboard and try again.',
      );
    },
    [pollBookingStatus, tryConfirmPayment, tryGenerateBriefing],
  );

  /** After payment succeeds — advance segments and poll for the brief. */
  const completePaymentAndFulfill = useCallback(
    async (id: string) => {
      activeRef.current = true;
      setBookingId(id);
      paymentConfirmAttemptsRef.current = 0;
      paymentConfirmInFlightRef.current = false;
      nextPaymentConfirmAtRef.current = 0;
      briefingAttemptedRef.current = false;
      setErrorMessage(null);

      const motionDelay = prefersReducedMotion() ? 0 : PHASE_DELAY_MS;

      setOverlayPhase('payment_success');
      await delay(motionDelay);
      if (!activeRef.current) return;

      setOverlayPhase('generating_brief');
      await pollUntilBriefReady(id);
    },
    [pollUntilBriefReady],
  );

  const closeBrief = useCallback(() => {
    setView('next_steps');
  }, []);

  const reset = useCallback(() => {
    activeRef.current = false;
    paymentConfirmAttemptsRef.current = 0;
    paymentConfirmInFlightRef.current = false;
    nextPaymentConfirmAtRef.current = 0;
    setOverlayPhase(null);
    setView('wizard');
    setBookingId(null);
    setBriefing(null);
    setErrorMessage(null);
  }, []);

  const isOverlayActive = overlayPhase !== null;

  return {
    view,
    overlayPhase,
    bookingId,
    mentorName,
    scheduledAt,
    briefing,
    thinkingStep,
    errorMessage,
    isOverlayActive,
    beginPaymentOverlay,
    dismissOverlay,
    completePaymentAndFulfill,
    closeBrief,
    reset,
  };
};
