'use client';

import { useCallback, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react';

type LandingComparisonSliderProps = {
  portrait: ReactNode;
  genericCard: ReactNode;
  expertCard: ReactNode;
  beforeHeading: ReactNode;
  afterHeading: ReactNode;
};

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function LandingComparisonSlider({
  portrait,
  genericCard,
  expertCard,
  beforeHeading,
  afterHeading,
}: LandingComparisonSliderProps) {
  const labelId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(38);

  const updateFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(clampPercent(next));
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromClientX(event.clientX);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    updateFromClientX(event.clientX);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="landing-comparison-slider flex flex-col gap-5" data-testid="landing-comparison-slider">
      <div>{beforeHeading}</div>

      <div
        ref={trackRef}
        className="landing-comparison-track relative min-h-[148px] overflow-hidden rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)] shadow-[0_16px_42px_-18px_rgba(14,20,32,0.18)] touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="absolute inset-0 p-4" aria-hidden={position >= 99}>
          {genericCard}
        </div>

        <div
          className="absolute inset-0 p-4 bg-[var(--landing-ink)]"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          aria-hidden={position <= 1}
        >
          {expertCard}
        </div>

        <div
          className="landing-comparison-divider pointer-events-none absolute inset-y-0 z-10 w-px bg-[var(--landing-accent)]"
          style={{ left: `${position}%` }}
          aria-hidden
        />
        <div
          className="landing-comparison-handle pointer-events-none absolute top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--landing-muted)] shadow-[0_10px_24px_-12px_rgba(14,20,32,0.35)]"
          style={{ left: `${position}%` }}
          aria-hidden
        >
          ⇔
        </div>

        <label htmlFor={labelId} className="sr-only">
          Compare generic online answers with AstroLink expert access
        </label>
        <input
          id={labelId}
          type="range"
          min={0}
          max={100}
          value={Math.round(position)}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="landing-comparison-range absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
          data-testid="landing-comparison-range"
        />
      </div>

      <div className="mx-auto w-full max-w-[280px]">{portrait}</div>

      <div>{afterHeading}</div>
    </div>
  );
}