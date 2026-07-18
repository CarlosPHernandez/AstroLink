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
  const [position, setPosition] = useState(42);

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
    <div className="landing-comparison-slider flex flex-col gap-6 sm:gap-8" data-testid="landing-comparison-slider">
      <div>{beforeHeading}</div>

      <div
        ref={trackRef}
        className="landing-comparison-track relative min-h-[200px] overflow-hidden rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface)] shadow-[0_12px_32px_-20px_rgba(14,20,32,0.14)] touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="absolute inset-0 flex items-center p-3.5 sm:p-4" aria-hidden={position >= 99}>
          {genericCard}
        </div>

        <div
          className="absolute inset-0 flex items-center p-3.5 sm:p-4"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          aria-hidden={position <= 1}
        >
          {expertCard}
        </div>

        <div
          className="landing-comparison-divider pointer-events-none absolute inset-y-2 z-10 w-0.5 bg-[var(--landing-border)]"
          style={{ left: `${position}%` }}
          aria-hidden
        />
        <div
          className="landing-comparison-handle landing-comparison-handle-knob pointer-events-none absolute top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)]"
          style={{ left: `${position}%` }}
          aria-hidden
        >
          <span className="flex gap-0.5" aria-hidden>
            <span className="h-3.5 w-0.5 rounded-full bg-[var(--landing-ink)]/55" />
            <span className="h-3.5 w-0.5 rounded-full bg-[var(--landing-ink)]/55" />
          </span>
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
          aria-valuetext={`${Math.round(position)} percent expert view`}
        />
      </div>

      <p className="text-center text-xs text-[var(--landing-faint)]">
        Drag the handle to compare
      </p>

      <div className="mx-auto w-full max-w-[220px] sm:max-w-[260px]">{portrait}</div>

      <div>{afterHeading}</div>
    </div>
  );
}