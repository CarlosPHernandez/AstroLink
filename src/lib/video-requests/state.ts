import type { VideoRequestStatus } from '@/lib/video-requests/types';

const ALLOWED: Record<VideoRequestStatus, readonly VideoRequestStatus[]> = {
  pending_payment: ['paid_awaiting_expert', 'refunded'],
  paid_awaiting_expert: ['delivered', 'declined', 'expired', 'refunded'],
  delivered: [],
  declined: ['refunded'],
  expired: ['refunded'],
  refunded: [],
};

export function canTransitionVideoRequest(
  from: VideoRequestStatus,
  to: VideoRequestStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED[from].includes(to);
}

export function computeVideoDueAt(paidAt: Date, slaDays: number): Date {
  const days = Math.max(1, Math.min(30, Math.floor(slaDays || 7)));
  const due = new Date(paidAt.getTime());
  due.setUTCDate(due.getUTCDate() + days);
  return due;
}

export function isVideoRequestOverdue(params: {
  status: VideoRequestStatus;
  dueAt: string | null;
  now?: Date;
}): boolean {
  if (params.status !== 'paid_awaiting_expert' || !params.dueAt) return false;
  const now = params.now ?? new Date();
  return new Date(params.dueAt).getTime() < now.getTime();
}

export function mentorVideoOfferActive(params: {
  videoRequestsEnabled: boolean;
  videoRequestPriceCents: number;
}): boolean {
  return params.videoRequestsEnabled && params.videoRequestPriceCents > 0;
}
