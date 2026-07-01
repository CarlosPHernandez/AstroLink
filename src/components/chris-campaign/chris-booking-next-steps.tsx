'use client';

import Link from 'next/link';
import { getPostBookingDashboardPath } from '@/lib/dashboard-paths';

type ChrisBookingNextStepsProps = {
  mentorName: string;
  sessionDateLabel: string;
  bookingId: string;
};

export function ChrisBookingNextSteps({
  mentorName,
  sessionDateLabel,
  bookingId,
}: ChrisBookingNextStepsProps) {
  const dashboardHref = getPostBookingDashboardPath('mentee', bookingId);

  return (
    <section
      className="chris-form-max chris-fade-in-up mx-auto w-full text-center"
      data-testid="chris-booking-next-steps"
    >
      <span
        className="material-symbols-outlined mb-md text-[56px] text-[#5b7fe6]"
        aria-hidden
      >
        mark_email_read
      </span>
      <h1 className="mb-sm text-[28px] font-semibold leading-tight text-white">You&apos;re all set</h1>
      <p className="mb-xs text-base text-white/70">
        Your {sessionDateLabel} session with {mentorName} is confirmed.
      </p>
      <p className="mb-lg text-sm leading-relaxed text-white/60">
        You&apos;ll get an email with your link to join the call 24 hours before your session.
      </p>
      <Link
        href={dashboardHref}
        data-testid="chris-view-dashboard"
        className="inline-flex w-full items-center justify-center rounded-lg bg-white py-sm text-base font-bold text-[#1c1c1c] transition-opacity hover:opacity-90"
      >
        View my dashboard
      </Link>
    </section>
  );
}