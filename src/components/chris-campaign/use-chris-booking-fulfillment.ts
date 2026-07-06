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

  const fulfillAttemptedRef = useRef(false);
  const paymentConfirmAttemptedRef = useRef(false);
  const briefingAttemptedRef = useRef(false);
  const activeRef = useRef(false);

  useEffect(() => {
    if (overlayPhase !== 'generating_brief') {
      setThinkingStep(0);
      return;
    }

    const interval = window.setInterval(() => {
      setThinkingStep((index) => (index + 1) % BRIEFING_THINKING_STEPS.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, [overlayPhase]);

  const pollBookingStatus = useCallback(async (id: string): Promise<BookingStatusResponse['data'] | null> => {
    const res = await fetch(`/api/bookings/${id}/status`);
    const json = (await res.json()) as BookingStatusResponse;
    if (!res.ok || !json.success || !json.data) {
      return null;
    }
    return json.data;
  }, []);

  const tryDevFulfill = useCallback(async (id: string) => {
    if (process.env.NODE_ENV === 'production' || fulfillAttemptedRef.current) {
      return;
    }
    fulfillAttemptedRef.current = true;
    await fetch('/api/book/fulfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: id }),
    });
  }, []);

  const tryConfirmPayment = useCallback(async (id: string) => {
    if (paymentConfirmAttemptedRef.current) {
      return;
    }
    paymentConfirmAttemptedRef.current = true;

    if (process.env.NODE_ENV !== 'production') {
      await tryDevFulfill(id);
      return;
    }

    await fetch(`/api/bookings/${id}/confirm-payment`, {
      method: 'POST',
    });
  }, [tryDevFulfill]);

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

  /** Show segment progress immediately when the user taps Pay / Authorize. */
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
          await tryConfirmPayment(id);
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
    [pollBookingStatus, tryDevFulfill, tryGenerateBriefing],
  );

  /** After payment succeeds — advance segments and poll for the brief. */
  const completePaymentAndFulfill = useCallback(
    async (id: string) => {
      activeRef.current = true;
      setBookingId(id);
      fulfillAttemptedRef.current = false;
      paymentConfirmAttemptedRef.current = false;
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
    paymentConfirmAttemptedRef.current = false;
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
