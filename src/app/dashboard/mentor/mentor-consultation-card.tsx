'use client';

import Link from 'next/link';
import {
  getMentorBookingContextSummary,
  type MentorBookingView,
} from '@/lib/mentor-booking-partition';
import { formatSessionWhen } from '@/lib/format';
import { SERVICE_TYPE_LABELS, type ServiceType } from '@/lib/types';

function canMentorJoin(booking: MentorBookingView): boolean {
  return Boolean(
    booking.dailyRoomUrl &&
      (booking.status === 'confirmed' || booking.status === 'completed'),
  );
}

export function MentorConsultationCard({
  booking,
  compact = false,
}: {
  booking: MentorBookingView;
  compact?: boolean;
}) {
  const contextSummary = getMentorBookingContextSummary(booking);
  const goals = booking.matchReason ?? 'No goals recorded for this session.';
  const canJoin = canMentorJoin(booking);

  return (
    <div
      data-testid={`mentor-booking-${booking.id}`}
      className="relative rounded-md border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
    >
      <span className="absolute top-0 right-0 rounded-bl-md border-b border-l border-outline-variant bg-surface-container-low px-3 py-1 text-[10px] font-medium uppercase text-on-surface-variant">
        {booking.status.replace(/_/g, ' ')}
      </span>

      <div className="mb-4 flex flex-col justify-between gap-4 pr-16 md:flex-row md:items-center">
        <div>
          <h3 className={`font-semibold text-on-surface ${compact ? 'text-base' : 'text-lg'}`}>
            {booking.menteeName}
          </h3>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            {SERVICE_TYPE_LABELS[booking.serviceType as ServiceType] ?? booking.serviceType} ·{' '}
            <span suppressHydrationWarning>{formatSessionWhen(booking.scheduledAt)}</span>
          </p>
        </div>
        {canJoin ? (
          <Link
            href={`/session/${booking.id}`}
            data-testid={`mentor-join-${booking.id}`}
            className="block rounded-md bg-primary px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-primary-container"
          >
            Join video room
          </Link>
        ) : null}
      </div>

      {!compact ? (
        <div className="grid grid-cols-1 gap-3 border-t border-surface-container pt-4 md:grid-cols-2">
          <div className="rounded-md border border-outline-variant/30 bg-surface-container-low/50 p-3">
            <p className="text-xs font-medium text-on-surface-variant">Goals</p>
            <p className="mt-1 text-sm text-on-surface">{goals}</p>
          </div>
          <div className="rounded-md border border-outline-variant/30 bg-surface-container-low/50 p-3">
            <p className="text-xs font-medium text-on-surface-variant">Context</p>
            <p className="mt-1 text-sm text-on-surface">{contextSummary}</p>
          </div>
        </div>
      ) : (
        <p className="line-clamp-2 border-t border-surface-container pt-2 text-sm text-on-surface-variant">
          <span className="font-medium text-on-surface">Goals: </span>
          {goals}
        </p>
      )}
    </div>
  );
}
