'use client';

import {
  SESSION_DURATION_DEFAULT,
  SESSION_DURATION_MAX,
  SESSION_DURATION_MIN,
  SESSION_DURATION_SEGMENTS,
  SESSION_DURATION_STEP,
  clampSessionDurationMinutes,
  filledSegmentCount,
} from '@/lib/session-duration';

type DurationStepperProps = {
  value: number;
  onChange: (minutes: number) => void;
  className?: string;
};

export function DurationStepper({
  value,
  onChange,
  className = '',
}: DurationStepperProps) {
  const minutes = clampSessionDurationMinutes(value || SESSION_DURATION_DEFAULT);
  const filled = filledSegmentCount(minutes);
  const atMin = minutes <= SESSION_DURATION_MIN;
  const atMax = minutes >= SESSION_DURATION_MAX;

  const stepBy = (delta: number) => {
    onChange(clampSessionDurationMinutes(minutes + delta));
  };

  return (
    <div className={`experts-duration ${className}`.trim()}>
      <p className="experts-duration__label">Session length</p>

      <div
        className="experts-duration__segs"
        role="meter"
        aria-valuemin={SESSION_DURATION_MIN}
        aria-valuemax={SESSION_DURATION_MAX}
        aria-valuenow={minutes}
        aria-label="Session length"
      >
        {Array.from({ length: SESSION_DURATION_SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={i < filled ? 'is-filled' : 'is-empty'}
            aria-hidden
          />
        ))}
      </div>

      <div className="experts-duration__stepper">
        <button
          type="button"
          className="experts-duration__step-btn"
          onClick={() => stepBy(-SESSION_DURATION_STEP)}
          disabled={atMin}
          aria-label={`Decrease session by ${SESSION_DURATION_STEP} minutes`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>

        <div className="experts-duration__readout">
          <span className="experts-duration__mins">{minutes}</span>
          <span className="experts-duration__unit">minutes</span>
        </div>

        <button
          type="button"
          className="experts-duration__step-btn"
          onClick={() => stepBy(SESSION_DURATION_STEP)}
          disabled={atMax}
          aria-label={`Increase session by ${SESSION_DURATION_STEP} minutes`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <p className="experts-duration__hint">
        {SESSION_DURATION_MIN} min minimum · {SESSION_DURATION_STEP} min steps · up to{' '}
        {SESSION_DURATION_MAX} min
      </p>
    </div>
  );
}
