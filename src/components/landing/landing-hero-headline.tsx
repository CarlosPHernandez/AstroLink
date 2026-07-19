'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/components/landing/landing-scroll-reveal';

/**
 * Rotating object phrases — kept short so "Talk to …" stays one line on
 * ~320px phones (prefix + phrase must not wrap or the levels split).
 */
const PHRASES = [
  "people who've done it",
  'astronauts who flew',
  'flight controllers',
  'mission operators',
] as const;

/** How long each phrase holds before the next transition. */
const HOLD_MS = 3400;
/** Crossfade duration (must stay in sync with CSS). */
const TRANSITION_MS = 680;

type Phase = 'idle' | 'exit' | 'enter';

/**
 * Inline rotating headline: "Talk to [phrase]."
 * Soft exit/enter crossfade + measured width morph.
 */
export function LandingHeroHeadline() {
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [slotWidth, setSlotWidth] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const measureRef = useRef<HTMLSpanElement>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const measurePhrase = (phraseIndex: number) => {
    const el = measureRef.current;
    if (!el) return null;
    el.textContent = PHRASES[phraseIndex] ?? PHRASES[0];
    return Math.ceil(el.getBoundingClientRect().width);
  };

  const applyWidth = (phraseIndex: number) => {
    const width = measurePhrase(phraseIndex);
    if (width != null) setSlotWidth(width);
  };

  useLayoutEffect(() => {
    applyWidth(index);
  }, [index]);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    setReducedMotion(reduced);
    applyWidth(0);

    if (reduced) return;

    const tick = () => {
      setIndex((current) => {
        const next = (current + 1) % PHRASES.length;
        clearTimers();
        setPrevIndex(current);
        setPhase('exit');
        // Morph width toward the incoming phrase immediately for a fluid feel.
        applyWidth(next);

        const enterId = window.setTimeout(() => {
          setPhase('enter');
        }, Math.round(TRANSITION_MS * 0.38));

        const idleId = window.setTimeout(() => {
          setPrevIndex(null);
          setPhase('idle');
        }, TRANSITION_MS);

        timersRef.current.push(enterId, idleId);
        return next;
      });
    };

    const intervalId = window.setInterval(tick, HOLD_MS);
    return () => {
      window.clearInterval(intervalId);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only rotator
  }, []);

  useEffect(() => {
    const onResize = () => applyWidth(index);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const active = PHRASES[index] ?? PHRASES[0];
  const outgoing = prevIndex !== null ? PHRASES[prevIndex] : null;

  return (
    <h1
      data-testid="landing-hero-title"
      className="landing-hero-intro font-landing-display text-[1.1875rem] leading-[1.28] xs:text-[1.3125rem] sm:text-4xl lg:text-[2.65rem] font-semibold tracking-tight text-[var(--landing-text)] sm:leading-[1.15]"
    >
      <span className="landing-hero-headline-line">
        <span className="landing-hero-headline-prefix">Talk to&nbsp;</span>
        <span
          className="landing-hero-headline-slot"
          style={slotWidth != null && !reducedMotion ? { width: slotWidth } : undefined}
          aria-live="polite"
          aria-atomic="true"
          data-testid="landing-hero-headline-rotator"
        >
          <span ref={measureRef} className="landing-hero-headline-measure" aria-hidden>
            {active}
          </span>

          {outgoing && !reducedMotion ? (
            <span
              className={`landing-hero-headline-phrase landing-hero-headline-phrase--out${
                phase === 'exit' || phase === 'enter' ? ' is-active' : ''
              }`}
              aria-hidden
            >
              {outgoing}
            </span>
          ) : null}

          <span
            className={`landing-hero-headline-phrase landing-hero-headline-phrase--in${
              phase === 'enter' ? ' is-entering' : phase === 'exit' ? ' is-waiting' : ''
            }${reducedMotion ? ' is-static' : ''}`}
            data-testid="landing-hero-headline-active"
          >
            {active}
          </span>
        </span>
        <span className="landing-hero-headline-period" aria-hidden>
          .
        </span>
      </span>
    </h1>
  );
}
