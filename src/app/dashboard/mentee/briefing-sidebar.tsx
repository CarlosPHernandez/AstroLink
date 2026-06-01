'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BriefingPayload } from '@/lib/briefing-display';
import { BRIEFING_THINKING_STEPS } from '@/lib/briefing-display';
import { BriefingContent } from './briefing-content';

export type BriefingSidebarState =
  | { mode: 'closed' }
  | {
      mode: 'thinking' | 'ready' | 'error';
      bookingId: string;
      mentorName: string;
      briefing?: BriefingPayload;
      error?: string;
    };

type BriefingSidebarProps = {
  state: BriefingSidebarState;
  onClose: () => void;
};

function AiThinkingOrb() {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <span className="absolute inset-0 rounded-full bg-primary/25 animate-ai-glow" />
      <span className="absolute inset-2 rounded-full bg-primary/35 animate-ai-pulse" />
      <span className="relative h-10 w-10 rounded-full bg-primary shadow-[0_0_32px_rgba(0,88,188,0.45)] animate-ai-breathe" />
    </div>
  );
}

export function BriefingSidebar({ state, onClose }: BriefingSidebarProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  const isOpen = state.mode !== 'closed';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      return;
    }

    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen, state.mode]);

  useEffect(() => {
    if (state.mode !== 'thinking') {
      setStepIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setStepIndex((i) => (i + 1) % BRIEFING_THINKING_STEPS.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, [state.mode]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || state.mode === 'closed') {
    return null;
  }

  const { mentorName, mode } = state;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close briefing panel"
        className={`fixed inset-0 z-[9998] bg-[#1a1b1f]/40 backdrop-blur-sm transition-opacity duration-300 ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="briefing-panel-title"
        className={`fixed top-0 right-0 z-[9999] flex h-dvh w-[min(100vw,26rem)] flex-col border-l border-outline-variant bg-surface-container-lowest shadow-[-12px_0_40px_rgba(26,27,31,0.14)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          entered ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-live="polite"
        aria-busy={mode === 'thinking'}
      >
        <header className="shrink-0 border-b border-outline-variant/80 bg-surface-container-low px-6 py-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded bg-primary px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-widest text-on-primary animate-ai-shimmer-badge">
                  APX-02
                </span>
                {mode === 'thinking' ? (
                  <span className="text-[9px] font-mono uppercase tracking-widest text-primary animate-pulse">
                    Thinking
                  </span>
                ) : mode === 'ready' ? (
                  <span className="text-[9px] font-mono uppercase tracking-widest text-on-surface-variant">
                    Ready
                  </span>
                ) : null}
              </div>
              <h2 id="briefing-panel-title" className="text-lg font-bold text-on-surface">
                Pre-session brief
              </h2>
              <p className="mt-0.5 truncate text-xs text-on-surface-variant">with {mentorName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md border border-outline-variant/60 bg-surface-container-lowest px-2.5 py-1.5 text-sm text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-surface-container-lowest px-6 py-6 scrollbar-none">
          {mode === 'thinking' ? (
            <div className="flex min-h-[min(420px,60dvh)] flex-col items-center justify-center gap-6 text-center animate-fade-in">
              <AiThinkingOrb />
              <div className="max-w-xs space-y-2">
                <p className="text-sm font-medium text-on-surface animate-ai-text-pulse">
                  {BRIEFING_THINKING_STEPS[stepIndex]}
                </p>
                <p className="text-xs leading-relaxed text-on-surface-variant">
                  AstroLink is preparing your expert session brief. This usually takes 10–30 seconds.
                </p>
              </div>
              <div className="mt-2 flex gap-1.5">
                {BRIEFING_THINKING_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i === stepIndex ? 'w-6 bg-primary' : 'w-1.5 bg-outline-variant'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {mode === 'error' ? (
            <div className="rounded-md border border-error/30 bg-error-container p-4 text-sm text-on-error-container">
              {state.error ?? 'Briefing generation failed.'}
            </div>
          ) : null}

          {mode === 'ready' && state.briefing ? (
            <BriefingContent briefing={state.briefing} />
          ) : null}
        </div>
      </aside>
    </>,
    document.body,
  );
}
