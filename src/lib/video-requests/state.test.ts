import { describe, expect, it } from 'vitest';
import {
  canTransitionVideoRequest,
  computeVideoDueAt,
  isVideoRequestOverdue,
  mentorVideoOfferActive,
} from '@/lib/video-requests/state';

describe('video-requests/state', () => {
  it('allows paid → delivered and paid → expired', () => {
    expect(canTransitionVideoRequest('paid_awaiting_expert', 'delivered')).toBe(true);
    expect(canTransitionVideoRequest('paid_awaiting_expert', 'expired')).toBe(true);
    expect(canTransitionVideoRequest('delivered', 'expired')).toBe(false);
  });

  it('computes due_at from paid_at + sla days', () => {
    const paid = new Date('2026-07-01T12:00:00.000Z');
    const due = computeVideoDueAt(paid, 7);
    expect(due.toISOString()).toBe('2026-07-08T12:00:00.000Z');
  });

  it('detects overdue open requests', () => {
    expect(
      isVideoRequestOverdue({
        status: 'paid_awaiting_expert',
        dueAt: '2026-07-01T00:00:00.000Z',
        now: new Date('2026-07-02T00:00:00.000Z'),
      }),
    ).toBe(true);
    expect(
      isVideoRequestOverdue({
        status: 'delivered',
        dueAt: '2026-07-01T00:00:00.000Z',
        now: new Date('2026-07-02T00:00:00.000Z'),
      }),
    ).toBe(false);
  });

  it('requires enabled flag and positive price for public offer', () => {
    expect(mentorVideoOfferActive({ videoRequestsEnabled: true, videoRequestPriceCents: 14900 })).toBe(
      true,
    );
    expect(mentorVideoOfferActive({ videoRequestsEnabled: true, videoRequestPriceCents: 0 })).toBe(
      false,
    );
    expect(mentorVideoOfferActive({ videoRequestsEnabled: false, videoRequestPriceCents: 14900 })).toBe(
      false,
    );
  });
});
