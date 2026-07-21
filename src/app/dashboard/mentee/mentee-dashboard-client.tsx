'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { logoutAction } from '@/app/auth/actions';
import {
  BriefingSidebar,
  type BriefingSidebarState,
} from '@/components/briefing/briefing-sidebar';
import {
  partitionMenteeBookings,
  type MenteeBookingView,
} from '@/lib/booking-partition';
import type { BriefingPayload } from '@/lib/briefing-display';
import { SERVICE_TYPE_LABELS } from '@/lib/types';
import { DashboardSessionTranscript } from '@/components/session/dashboard-session-transcript';
import { formatSessionWhen } from '@/lib/format';
import {
  canShowJoinControl,
  isJoinRoomEnabled,
  joinRoomAvailabilityTitle,
} from '@/lib/join-window';

interface SessionData {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
}

type BriefingApiResponse = {
  success?: boolean;
  error?: string;
  data?: { briefing: BriefingPayload };
};

export default function MenteeDashboardClient({
  session,
  bookings,
  skipPayments = false,
}: {
  session: SessionData;
  bookings: MenteeBookingView[];
  skipPayments?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookedId = searchParams.get('booked');
  const handledBookedRef = useRef<string | null>(null);
  const [localBriefings, setLocalBriefings] = useState<Record<string, BriefingPayload>>({});
  const [sidebar, setSidebar] = useState<BriefingSidebarState>({ mode: 'closed' });
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Live "now" for enabling Join room buttons as the 15-minute window approaches.
  // The authoritative gate is still enforced server-side when navigating to /session.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const getJoinState = useCallback((booking: MenteeBookingView) => {
    const hasJoinControl = canShowJoinControl(booking.status);
    const joinEnabled = hasJoinControl
      ? isJoinRoomEnabled(
          booking.status,
          booking.dailyRoomUrl,
          booking.scheduledAt,
          now,
          booking.durationMinutes,
        )
      : false;
    return { hasJoinControl, joinEnabled };
  }, [now]);

  const { upcoming, past, nextUpcoming } = useMemo(
    () => partitionMenteeBookings(bookings, new Date(now)),
    [bookings, now],
  );

  const resolveBriefing = useCallback(
    (booking: MenteeBookingView): BriefingPayload | null => {
      return localBriefings[booking.id] ?? booking.briefing;
    },
    [localBriefings],
  );

  const openBriefingPanel = useCallback((booking: MenteeBookingView, briefing: BriefingPayload) => {
    setSidebar({
      mode: 'ready',
      bookingId: booking.id,
      counterpartyName: booking.mentorName,
      audience: 'mentee',
      briefing,
    });
  }, []);

  const generateBriefing = useCallback(async (booking: MenteeBookingView) => {
    setGeneratingId(booking.id);
    setSidebar({
      mode: 'thinking',
      bookingId: booking.id,
      counterpartyName: booking.mentorName,
      audience: 'mentee',
    });

    try {
      const res = await fetch('/api/book/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const json = (await res.json()) as BriefingApiResponse;

      if (!res.ok || !json.success || !json.data?.briefing) {
        throw new Error(json.error ?? 'Could not generate briefing');
      }

      const briefing = json.data.briefing;
      setLocalBriefings((prev) => ({ ...prev, [booking.id]: briefing }));
      setSidebar({
        mode: 'ready',
        bookingId: booking.id,
        counterpartyName: booking.mentorName,
        audience: 'mentee',
        briefing,
      });
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not generate briefing';
      setSidebar({
        mode: 'error',
        bookingId: booking.id,
        counterpartyName: booking.mentorName,
        audience: 'mentee',
        error: message,
      });
    } finally {
      setGeneratingId(null);
    }
  }, [router]);

  useEffect(() => {
    if (!bookedId || handledBookedRef.current === bookedId) {
      return;
    }

    const booking = bookings.find((b) => b.id === bookedId);
    if (!booking) {
      return;
    }

    if (booking.status === 'pending_payment') {
      return;
    }

    handledBookedRef.current = bookedId;

    const frame = window.requestAnimationFrame(() => {
      const briefing = localBriefings[booking.id] ?? booking.briefing;
      if (briefing) {
        openBriefingPanel(booking, briefing);
      } else {
        void generateBriefing(booking);
      }

      router.replace('/dashboard/mentee', { scroll: false });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [bookedId, bookings, generateBriefing, localBriefings, openBriefingPanel, router]);

  // Auto-refresh a few times if the just-booked item is still pending_payment.
  // Lets the Stripe webhook (succeeded -> fulfill -> confirmed + room) catch up and
  // show the join button + updated status without the user having to manually reload.
  // (Critical for the "payments succeed (200) but pending in DB/list" + "no join at T-5min" flow.)
  useEffect(() => {
    if (!bookedId) return;
    const b = bookings.find((bb) => bb.id === bookedId);
    if (!b || b.status !== 'pending_payment') return;

    const t1 = setTimeout(() => router.refresh(), 1200);
    const t2 = setTimeout(() => router.refresh(), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [bookedId, bookings, router]);

  function renderUpcomingCard(booking: MenteeBookingView) {
    const briefing = resolveBriefing(booking);
    const isGenerating = generatingId === booking.id;

    const { hasJoinControl, joinEnabled } = getJoinState(booking);

    return (
      <div
        key={booking.id}
        data-testid={`booking-row-${booking.id}`}
        className={`border bg-surface-container-lowest p-5 rounded-md relative shadow-sm transition-colors ${
          isGenerating ? 'border-primary/40 ring-2 ring-primary/10' : 'border-outline-variant'
        }`}
      >
        <span className="absolute top-0 right-0 px-3 py-1 bg-surface-container-low text-on-surface-variant text-[9px] font-mono font-bold rounded-bl-md border-l border-b border-outline-variant uppercase">
          {booking.status === 'pending_payment' ? 'Awaiting confirmation' : booking.status}
        </span>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-16">
          <div>
            <h3 className="text-base font-bold text-on-surface">{booking.mentorName}</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {SERVICE_TYPE_LABELS[booking.serviceType]}
              {booking.durationMinutes ? ` · ${booking.durationMinutes} min` : ''} ·{' '}
              <span suppressHydrationWarning>{formatSessionWhen(booking.scheduledAt)}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {briefing ? (
              <button
                type="button"
                onClick={() => openBriefingPanel(booking, briefing)}
                className="px-3 py-2 rounded-md border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-semibold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                View brief
              </button>
            ) : booking.status === 'confirmed' || booking.status === 'pending_payment' ? (
              <button
                type="button"
                onClick={() => generateBriefing(booking)}
                disabled={generatingId !== null}
                className="px-3 py-2 rounded-md border border-outline-variant text-on-surface-variant hover:text-on-surface text-[10px] font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {skipPayments ? 'Generate brief' : (booking.status === 'pending_payment' ? 'Brief (confirming payment)' : 'Generate brief')}
              </button>
            ) : null}
            {hasJoinControl ? (
              joinEnabled ? (
                <Link
                  href={`/session/${booking.id}`}
                  data-testid={`booking-join-${booking.id}`}
                  className="px-3 py-2 rounded-md bg-primary hover:bg-primary-container text-white font-semibold text-[10px] uppercase tracking-wider shadow-sm"
                >
                  Join room
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  data-testid={`booking-join-${booking.id}`}
                  className="px-3 py-2 rounded-md bg-primary/50 text-white/70 font-semibold text-[10px] uppercase tracking-wider cursor-not-allowed"
                  title={joinRoomAvailabilityTitle()}
                >
                  Join room
                </button>
              )
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function renderPastRow(booking: MenteeBookingView) {
    const briefing = resolveBriefing(booking);
    return (
      <div
        key={booking.id}
        data-testid={`booking-past-${booking.id}`}
        className="py-4 border-b border-outline-variant/40 last:border-0"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-on-surface">{booking.mentorName}</p>
            <p className="text-[11px] text-on-surface-variant">
              <span suppressHydrationWarning>{formatSessionWhen(booking.scheduledAt)}</span> ·{' '}
              {booking.status === 'pending_payment' ? 'Awaiting confirmation' : booking.status}
            </p>
          </div>
          <div className="flex gap-2">
            {briefing ? (
              <button
                type="button"
                onClick={() => openBriefingPanel(booking, briefing)}
                className="text-[10px] font-semibold text-primary uppercase tracking-wider hover:underline cursor-pointer"
              >
                View brief
              </button>
            ) : null}
            {booking.status === 'completed' ? (
              <Link
                href={`/session/${booking.id}`}
                className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider hover:text-on-surface"
              >
                Session recap
              </Link>
            ) : null}
          </div>
        </div>
        {booking.status === 'completed' ? (
          <DashboardSessionTranscript
            bookingId={booking.id}
            mentorName={booking.mentorName}
            menteeName={session.fullName}
            viewerRole="mentee"
            testIdPrefix={`booking-past-${booking.id}`}
          />
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background text-on-surface p-8 font-sans">
        <div className="max-w-5xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-outline-variant">
            <div>
              <span className="px-2 py-0.5 text-[9px] font-mono bg-primary text-white rounded uppercase tracking-widest font-semibold">
                Your sessions
              </span>
              <h1 className="text-2xl font-bold text-on-surface tracking-tight mt-2">
                Hello,{' '}
                <span className="font-light italic bg-gradient-to-r from-black via-zinc-800 to-zinc-600 bg-clip-text text-transparent">
                  {session.fullName}
                </span>
              </h1>
              <p className="text-on-surface-variant text-xs mt-1">
                Upcoming calls first, then your session history.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/mentee/settings"
                data-testid="mentee-settings-link"
                className="px-4 py-2 rounded-md border border-outline-variant hover:border-outline text-on-surface-variant hover:text-on-surface text-xs font-semibold uppercase tracking-wider transition-all bg-surface shadow-sm"
              >
                Settings
              </Link>
              <Link
                href="/booking"
                className="px-5 py-2.5 rounded-md bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
              >
                Book session
              </Link>
              <button
                type="button"
                onClick={() => logoutAction()}
                className="px-4 py-2 rounded-md border border-outline-variant hover:border-outline text-on-surface-variant hover:text-on-surface text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer bg-surface shadow-sm"
              >
                Sign out
              </button>
            </div>
          </header>

          {bookings.length === 0 ? (
            <div className="border border-outline-variant rounded-md p-8 text-center text-on-surface-variant text-sm">
              No sessions yet.{' '}
              <Link href="/" className="text-primary font-semibold hover:underline">
                Browse experts
              </Link>{' '}
              to book your first call.
            </div>
          ) : (
            <div className="space-y-10">
              {nextUpcoming ? (
                <section
                  className="rounded-md border border-primary/25 bg-primary/5 p-6"
                  data-testid="mentee-next-session"
                >
                  <p className="text-[9px] font-mono uppercase tracking-widest text-primary font-bold mb-2">
                    Next session
                  </p>
                  <h2 className="text-xl font-bold text-on-surface mb-1">{nextUpcoming.mentorName}</h2>
                  <p className="text-sm text-on-surface-variant mb-4">
                    <span suppressHydrationWarning>
                      {formatSessionWhen(nextUpcoming.scheduledAt)}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {resolveBriefing(nextUpcoming) ? (
                      <button
                        type="button"
                        onClick={() =>
                          openBriefingPanel(nextUpcoming, resolveBriefing(nextUpcoming)!)
                        }
                        className="px-4 py-2 rounded-md border border-primary/40 text-primary text-xs font-semibold uppercase tracking-wider cursor-pointer bg-surface"
                      >
                        Open brief
                      </button>
                    ) : null}
                    {(() => {
                      const { hasJoinControl, joinEnabled } = getJoinState(nextUpcoming);
                      if (!hasJoinControl) return null;
                      return joinEnabled ? (
                        <Link
                          href={`/session/${nextUpcoming.id}`}
                          className="px-4 py-2 rounded-md bg-primary text-white text-xs font-semibold uppercase tracking-wider shadow-sm"
                        >
                          Join video room
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="px-4 py-2 rounded-md bg-primary/50 text-white/70 text-xs font-semibold uppercase tracking-wider cursor-not-allowed"
                          title={joinRoomAvailabilityTitle()}
                        >
                          Join video room
                        </button>
                      );
                    })()}
                  </div>
                </section>
              ) : null}

              <section data-testid="mentee-upcoming-sessions">
                <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-4">
                  Upcoming ({upcoming.length})
                </h2>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No upcoming sessions scheduled.</p>
                ) : (
                  <div className="space-y-3">{upcoming.map(renderUpcomingCard)}</div>
                )}
              </section>

              <section data-testid="mentee-past-sessions">
                <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-4">
                  Past sessions ({past.length})
                </h2>
                {past.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No past sessions yet.</p>
                ) : (
                  <div className="border border-outline-variant rounded-md bg-surface-container-lowest px-5">
                    {past.map(renderPastRow)}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      <BriefingSidebar
        state={sidebar}
        onClose={() => setSidebar({ mode: 'closed' })}
        onRegenerate={
          sidebar.mode !== 'closed'
            ? () => {
                const booking = bookings.find((b) => b.id === sidebar.bookingId);
                if (booking) {
                  void generateBriefing(booking);
                }
              }
            : undefined
        }
      />
    </>
  );
}
