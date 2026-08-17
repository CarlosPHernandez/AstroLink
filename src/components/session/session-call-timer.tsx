'use client';

import { useEffect, useState } from 'react';

import {
  getSessionTimerSnapshot,
  type SessionTimerSnapshot,
  type SessionTimerUrgency,
} from '@/lib/session-call-timer';

type SessionCallTimerProps = {
  scheduledAt: string;
  durationMinutes: number | null;
  /** Compact header chip vs. full call-bar label. */
  variant?: 'header' | 'call';
  className?: string;
};

function urgencyClasses(urgency: SessionTimerUrgency, variant: 'header' | 'call'): string {
  const base =
    variant === 'header'
      ? 'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-label-sm font-mono tabular-nums'
      : 'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-label-sm font-mono tabular-nums font-semibold';

  switch (urgency) {
    case 'critical':
    case 'ended':
      return `${base} bg-error-container text-on-error-container`;
    case 'warning':
      return `${base} bg-amber-500/15 text-amber-800 ring-1 ring-inset ring-amber-500/40`;
    default:
      return `${base} bg-surface-container-high text-on-surface`;
  }
}

function urgencyPrefix(urgency: SessionTimerUrgency): string {
  if (urgency === 'ended') {
    return 'Time up';
  }
  if (urgency === 'critical') {
    return 'Ending soon';
  }
  if (urgency === 'warning') {
    return 'Wrap up';
  }
  return 'Time left';
}

export function SessionCallTimer({
  scheduledAt,
  durationMinutes,
  variant = 'call',
  className = '',
}: SessionCallTimerProps) {
  const [snapshot, setSnapshot] = useState<SessionTimerSnapshot | null>(() =>
    getSessionTimerSnapshot(scheduledAt, durationMinutes),
  );

  useEffect(() => {
    const tick = () => {
      setSnapshot(getSessionTimerSnapshot(scheduledAt, durationMinutes));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [scheduledAt, durationMinutes]);

  if (!snapshot) {
    return null;
  }

  const label = urgencyPrefix(snapshot.urgency);

  return (
    <div
      data-testid={variant === 'header' ? 'session-call-timer-header' : 'session-call-timer'}
      data-urgency={snapshot.urgency}
      role="timer"
      aria-live={snapshot.urgency === 'normal' ? 'off' : 'polite'}
      aria-atomic="true"
      aria-label={snapshot.ariaLabel}
      title={`${label}: ${snapshot.display}`}
      className={`${urgencyClasses(snapshot.urgency, variant)} ${className}`.trim()}
    >
      <span className="sr-only">{snapshot.ariaLabel}</span>
      <span
        aria-hidden="true"
        className={
          variant === 'header'
            ? 'text-[10px] font-sans font-semibold uppercase tracking-wide text-inherit opacity-80'
            : 'text-[10px] font-sans font-semibold uppercase tracking-wide opacity-80'
        }
      >
        {label}
      </span>
      <span data-testid="session-call-timer-display" aria-hidden="true">
        {snapshot.display}
      </span>
    </div>
  );
}
