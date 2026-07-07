'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BRIEFING_THINKING_STEPS } from '@/lib/briefing-display';
import { ChrisSegmentedProgress } from '@/components/chris-campaign/chris-segmented-progress';

export type ChrisFulfillmentOverlayPhase =
  | 'authorizing'
  | 'payment_success'
  | 'generating_brief'
  | 'error';

const PHASE_SEGMENTS: Record<ChrisFulfillmentOverlayPhase, number> = {
  authorizing: 1,
  payment_success: 2,
  generating_brief: 4,
  error: 0,
};

const PHASE_LABELS: Record<ChrisFulfillmentOverlayPhase, string> = {
  authorizing: 'Processing payment…',
  payment_success: 'Payment confirmed',
  generating_brief: 'Generating your pre-call brief',
  error: 'Something went wrong',
};

type ChrisBookingFulfillmentOverlayProps = {
  phase: ChrisFulfillmentOverlayPhase;
  thinkingStep?: number;
  errorMessage?: string | null;
  onViewDashboard?: () => void;
};

export function ChrisBookingFulfillmentOverlay({
  phase,
  thinkingStep = 0,
  errorMessage,
  onViewDashboard,
}: ChrisBookingFulfillmentOverlayProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (typeof document === 'undefined') {
    return null;
  }

  const thinkingLabel =
    phase === 'generating_brief'
      ? BRIEFING_THINKING_STEPS[thinkingStep % BRIEFING_THINKING_STEPS.length]
      : undefined;

  const filledSegments = PHASE_SEGMENTS[phase] || 0;

  return createPortal(
    <div
      className="chris-landing fixed inset-0 z-40 flex items-center justify-center bg-[#1c1c1c]/95 px-md backdrop-blur-sm"
      data-testid="chris-fulfillment-overlay"
      aria-live="polite"
      aria-busy={phase !== 'error'}
    >
      <div className="chris-overlay-panel flex flex-col items-center gap-[1.5rem] px-[1rem] text-center">
        {phase === 'payment_success' ? (
          <span
            className="material-symbols-outlined text-[48px] text-[#5b7fe6]"
            aria-hidden
          >
            check_circle
          </span>
        ) : null}

        {phase === 'error' ? (
          <div className="space-y-md">
            <p className="text-sm text-white/80">{errorMessage ?? 'Please try your dashboard.'}</p>
            {onViewDashboard ? (
              <button
                type="button"
                onClick={onViewDashboard}
                className="rounded-lg bg-white px-md py-sm text-sm font-semibold text-[#1c1c1c]"
              >
                View dashboard
              </button>
            ) : null}
          </div>
        ) : (
          <ChrisSegmentedProgress
            totalSegments={4}
            filledSegments={filledSegments}
            label={PHASE_LABELS[phase]}
            sublabel={
              phase === 'generating_brief'
                ? `${thinkingLabel} This usually takes 10–30 seconds.`
                : undefined
            }
            pulseUnfilled={filledSegments < 4}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
