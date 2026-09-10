/** Allow join a few minutes early (clock skew / waiting room). */
export const SESSION_COMPLETE_EARLY_GRACE_MS = 5 * 60 * 1000;

export function sessionCompleteTooEarly(params: {
  status: string;
  scheduledAt: string | null | undefined;
  sessionRole?: string;
  nowMs?: number;
}): { blocked: false } | { blocked: true; error: string } {
  // Idempotent replay after the webhook already completed the booking.
  if (params.status === 'completed') {
    return { blocked: false };
  }

  if (params.sessionRole === 'admin') {
    return { blocked: false };
  }

  if (!params.scheduledAt) {
    return { blocked: true, error: 'Session has not started yet.' };
  }

  const scheduledMs = new Date(params.scheduledAt).getTime();
  if (!Number.isFinite(scheduledMs)) {
    return { blocked: true, error: 'Session has not started yet.' };
  }

  const nowMs = params.nowMs ?? Date.now();
  if (nowMs + SESSION_COMPLETE_EARLY_GRACE_MS < scheduledMs) {
    return { blocked: true, error: 'Session has not started yet.' };
  }

  return { blocked: false };
}
