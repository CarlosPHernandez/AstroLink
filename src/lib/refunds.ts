import 'server-only';

/**
 * Cancellation + refund policy (pure, unit-testable).
 * Launch policy: full refund if cancelled >= 24h before scheduled start.
 * Within window: not refundable (simple; future fast-follow may support partials/credits).
 */

export type RefundDecision = {
  refundable: boolean;
  reason: string;
  refundPercent: number; // 0 or 100 at launch
};

const DEFAULT_HOURS_THRESHOLD = 24;

export function computeCancellationRefund(
  scheduledAt: string | Date,
  now: Date = new Date(),
  hoursThreshold = DEFAULT_HOURS_THRESHOLD,
): RefundDecision {
  const sched = scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt);
  if (Number.isNaN(sched.getTime())) {
    return {
      refundable: false,
      reason: 'Invalid scheduled time',
      refundPercent: 0,
    };
  }

  const diffMs = sched.getTime() - now.getTime();
  const hours = diffMs / (1000 * 60 * 60);

  if (hours >= hoursThreshold) {
    return {
      refundable: true,
      reason: `Full refund (cancelled ≥${hoursThreshold}h before session)`,
      refundPercent: 100,
    };
  }

  return {
    refundable: false,
    reason: `Cancellation is within ${hoursThreshold}h of the session start; no refund per policy`,
    refundPercent: 0,
  };
}

/** Convenience: true if the booking is eligible for (full) refund on cancel. */
export function isEligibleForFullRefund(scheduledAt: string | Date, now: Date = new Date()): boolean {
  return computeCancellationRefund(scheduledAt, now).refundable;
}
