'use client';

import Link from 'next/link';
import { isSessionBriefing } from '@/lib/briefing-display';
import {
  getMentorBookingContextSummary,
  type MentorBookingView,
} from '@/lib/mentor-booking-partition';
import { DashboardSessionTranscript } from '@/components/session/dashboard-session-transcript';
import { formatSessionWhen } from '@/lib/format';
import { formatServiceTypeLabel, type BookingStatus } from '@/lib/types';
import { isJoinRoomEnabled, joinRoomAvailabilityTitle } from '@/lib/join-window';

function canMentorJoin(booking: MentorBookingView): boolean {
  return booking.status === 'confirmed' || booking.status === 'completed';
}

function isMentorJoinEnabled(booking: MentorBookingView, nowMs: number = Date.now()): boolean {
  return isJoinRoomEnabled(
    booking.status,
    booking.dailyRoomUrl,
    booking.scheduledAt,
    nowMs,
    booking.durationMinutes,
  );
}

function bookingStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'pending_payment':
      return 'Pending payment';
    case 'confirmed':
      return 'Confirmed';
    case 'completed':
      return 'Completed';
    case 'pending_review':
      return 'Pending review';
    case 'payment_failed':
      return 'Payment failed';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
  }
}

function bookingStatusStyles(status: BookingStatus): string {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-800';
    case 'completed':
      return 'bg-surface-container text-on-surface-variant';
    case 'pending_payment':
    case 'pending_review':
      return 'bg-amber-50 text-amber-800';
    case 'payment_failed':
    case 'cancelled':
    case 'refunded':
      return 'bg-red-50 text-red-800';
  }
}

export function MentorConsultationCard({
  booking,
  compact = false,
  mentorName,
  onViewPrepBrief,
  prepBriefGenerating = false,
}: {
  booking: MentorBookingView;
  compact?: boolean;
  mentorName: string;
  onViewPrepBrief?: (booking: MentorBookingView) => void;
  prepBriefGenerating?: boolean;
}) {
  const contextSummary = getMentorBookingContextSummary(booking);
  const goals = booking.matchReason ?? 'No goals recorded for this session.';
  const hasJoinControl = canMentorJoin(booking);
  const joinEnabled = hasJoinControl ? isMentorJoinEnabled(booking) : false;
  const serviceLabel = formatServiceTypeLabel(booking.serviceType, booking.durationMinutes);
  const hasPrepBrief = isSessionBriefing(booking.briefing);

  return (
    <article
      data-testid={`mentor-booking-${booking.id}`}
      className="space-y-4 rounded-lg border border-outline-variant bg-surface p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={`font-semibold text-on-surface ${compact ? 'text-base' : 'text-lg'}`}>
            {booking.menteeName}
          </h3>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            {serviceLabel} ·{' '}
            <span suppressHydrationWarning>{formatSessionWhen(booking.scheduledAt)}</span>
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 rounded px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${bookingStatusStyles(booking.status)}`}
        >
          {bookingStatusLabel(booking.status)}
        </span>
      </div>

      {!compact ? (
        <div className="space-y-3 border-t border-outline-variant/40 pt-4">
          <div>
            <p className="text-xs font-medium text-on-surface-variant">Goals</p>
            <p className="mt-1 text-sm leading-relaxed text-on-surface">{goals}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-on-surface-variant">Context</p>
            <p className="mt-1 text-sm leading-relaxed text-on-surface">{contextSummary}</p>
          </div>
        </div>
      ) : (
        <p className="line-clamp-2 border-t border-outline-variant/40 pt-4 text-sm leading-relaxed text-on-surface-variant">
          <span className="font-medium text-on-surface">Goals: </span>
          {goals}
        </p>
      )}

      {booking.status === 'completed' ? (
        <div className="space-y-3 border-t border-outline-variant/40 pt-4">
          <Link
            href={`/session/${booking.id}`}
            data-testid={`mentor-recap-${booking.id}`}
            className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
          >
            Session recap
          </Link>
          <DashboardSessionTranscript
            bookingId={booking.id}
            mentorName={mentorName}
            menteeName={booking.menteeName}
            viewerRole="mentor"
            testIdPrefix={`mentor-booking-${booking.id}`}
          />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 border-t border-outline-variant/40 pt-4">
          {hasPrepBrief && onViewPrepBrief ? (
            <button
              type="button"
              data-testid={`mentor-prep-brief-${booking.id}`}
              onClick={() => onViewPrepBrief(booking)}
              disabled={prepBriefGenerating}
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-primary/10 disabled:opacity-50 cursor-pointer"
            >
              View prep brief
            </button>
          ) : null}
          {hasJoinControl ? (
            joinEnabled ? (
              <Link
                href={`/session/${booking.id}`}
                data-testid={`mentor-join-${booking.id}`}
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-primary-container"
              >
                Join video room
              </Link>
            ) : (
              <button
                type="button"
                disabled
                data-testid={`mentor-join-${booking.id}`}
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white/70 cursor-not-allowed"
                title={joinRoomAvailabilityTitle()}
              >
                Join video room
              </button>
            )
          ) : null}
        </div>
      )}
    </article>
  );
}