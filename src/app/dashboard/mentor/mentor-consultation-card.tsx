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

function bookingChipClass(status: BookingStatus): string {
  switch (status) {
    case 'confirmed':
      return 'md-chip md-chip-success';
    case 'completed':
      return 'md-chip md-chip-neutral';
    case 'pending_payment':
    case 'pending_review':
      return 'md-chip md-chip-warn';
    case 'payment_failed':
    case 'cancelled':
    case 'refunded':
      return 'md-chip md-chip-danger';
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
    <article data-testid={`mentor-booking-${booking.id}`} className="md-card">
      <div className="md-card-head">
        <div className="min-w-0">
          <h3 className="md-card-title">{booking.menteeName}</h3>
          <p className="md-card-meta" style={{ marginTop: 4 }}>
            {serviceLabel} ·{' '}
            <span suppressHydrationWarning>{formatSessionWhen(booking.scheduledAt)}</span>
          </p>
        </div>
        <span className={bookingChipClass(booking.status)}>
          {bookingStatusLabel(booking.status)}
        </span>
      </div>

      {!compact ? (
        <>
          <hr className="md-card-divider" />
          <div className="md-stack-tight">
            <div>
              <p className="md-card-label">Goals</p>
              <p className="md-card-meta" style={{ marginTop: 4, color: 'var(--md-text)' }}>
                {goals}
              </p>
            </div>
            <div>
              <p className="md-card-label">Context</p>
              <p className="md-card-meta" style={{ marginTop: 4, color: 'var(--md-text)' }}>
                {contextSummary}
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          <hr className="md-card-divider" />
          <p className="md-card-meta line-clamp-2">
            <span style={{ color: 'var(--md-text)', fontWeight: 500 }}>Goals: </span>
            {goals}
          </p>
        </>
      )}

      {booking.status === 'completed' ? (
        <>
          <hr className="md-card-divider" />
          <div className="md-stack-tight">
            <Link
              href={`/session/${booking.id}`}
              data-testid={`mentor-recap-${booking.id}`}
              className="md-link"
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
        </>
      ) : (
        <>
          <hr className="md-card-divider" />
          <div className="md-btn-row">
            {hasPrepBrief && onViewPrepBrief ? (
              <button
                type="button"
                data-testid={`mentor-prep-brief-${booking.id}`}
                onClick={() => onViewPrepBrief(booking)}
                disabled={prepBriefGenerating}
                className="md-btn md-btn-ghost"
              >
                View prep brief
              </button>
            ) : null}
            {hasJoinControl ? (
              joinEnabled ? (
                <Link
                  href={`/session/${booking.id}`}
                  data-testid={`mentor-join-${booking.id}`}
                  className="md-btn md-btn-primary"
                >
                  Join video room
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  data-testid={`mentor-join-${booking.id}`}
                  className="md-btn md-btn-primary"
                  title={joinRoomAvailabilityTitle()}
                >
                  Join video room
                </button>
              )
            ) : null}
          </div>
        </>
      )}
    </article>
  );
}
