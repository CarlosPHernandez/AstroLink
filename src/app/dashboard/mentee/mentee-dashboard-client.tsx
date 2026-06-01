'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/app/auth/actions';
import { BriefingContent } from '@/app/dashboard/mentee/briefing-content';
import {
  BriefingSidebar,
  type BriefingSidebarState,
} from '@/app/dashboard/mentee/briefing-sidebar';
import type { MenteeBookingView } from '@/lib/mentee-bookings';
import type { BriefingPayload } from '@/lib/briefing-display';
import { isSessionBriefing } from '@/lib/briefing-display';
import { SERVICE_TYPE_LABELS, type ServiceType } from '@/lib/types';

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
  const [localBriefings, setLocalBriefings] = useState<Record<string, BriefingPayload>>({});
  const [sidebar, setSidebar] = useState<BriefingSidebarState>({ mode: 'closed' });
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const resolveBriefing = useCallback(
    (booking: MenteeBookingView): BriefingPayload | null => {
      return localBriefings[booking.id] ?? booking.briefing;
    },
    [localBriefings],
  );

  function openBriefingPanel(booking: MenteeBookingView, briefing: BriefingPayload) {
    setSidebar({
      mode: 'ready',
      bookingId: booking.id,
      mentorName: booking.mentorName,
      briefing,
    });
  }

  async function generateBriefing(booking: MenteeBookingView) {
    setGeneratingId(booking.id);
    setSidebar({
      mode: 'thinking',
      bookingId: booking.id,
      mentorName: booking.mentorName,
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
        mentorName: booking.mentorName,
        briefing,
      });
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not generate briefing';
      setSidebar({
        mode: 'error',
        bookingId: booking.id,
        mentorName: booking.mentorName,
        error: message,
      });
    } finally {
      setGeneratingId(null);
    }
  }

  function closeSidebar() {
    setSidebar({ mode: 'closed' });
  }

  return (
    <>
      <div className="min-h-screen bg-background text-on-surface p-8 font-sans">
        <div className="max-w-5xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-outline-variant">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2 py-0.5 text-[9px] font-mono bg-primary text-white rounded uppercase tracking-widest font-semibold">
                  Your sessions
                </span>
              </div>
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">
                Hello,{' '}
                <span className="font-light italic bg-gradient-to-r from-black via-zinc-800 to-zinc-600 bg-clip-text text-transparent">
                  {session.fullName}
                </span>
              </h1>
              <p className="text-on-surface-variant text-xs mt-1">
                Upcoming expert calls, pre-session briefs, and video rooms.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/booking"
                className="px-5 py-2.5 rounded-md bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
              >
                Book another session
              </Link>
              <button
                type="button"
                onClick={() => logoutAction()}
                className="px-4 py-2 rounded-md border border-outline-variant hover:border-outline text-on-surface-variant hover:text-on-surface text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer bg-surface shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </header>

          <div className="space-y-8">
            {bookings.length === 0 ? (
              <div className="border border-outline-variant rounded-md p-8 text-center text-on-surface-variant text-sm">
                No sessions yet.{' '}
                <Link href="/" className="text-primary font-semibold hover:underline">
                  Browse experts
                </Link>{' '}
                to book your first call.
              </div>
            ) : (
              bookings.map((booking) => {
                const briefing = resolveBriefing(booking);
                const isGenerating = generatingId === booking.id;
                const sessionBriefing = briefing && isSessionBriefing(briefing) ? briefing : null;
                const canJoin =
                  booking.dailyRoomUrl &&
                  (booking.status === 'confirmed' || booking.status === 'completed');

                return (
                  <div
                    key={booking.id}
                    data-testid={`booking-row-${booking.id}`}
                    className={`border bg-surface-container-lowest p-6 rounded-md relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-colors duration-300 ${
                      isGenerating
                        ? 'border-primary/40 ring-2 ring-primary/10'
                        : 'border-outline-variant'
                    }`}
                  >
                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-surface-container-low text-on-surface-variant text-[9px] font-mono font-bold rounded-bl-md border-l border-b border-outline-variant uppercase">
                      {booking.status}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-on-surface mb-1">{booking.mentorName}</h3>
                        <p className="text-xs text-on-surface-variant uppercase tracking-wide">
                          {SERVICE_TYPE_LABELS[booking.serviceType as ServiceType] ?? booking.serviceType}{' '}
                          • {new Date(booking.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {briefing ? (
                          <button
                            type="button"
                            onClick={() => openBriefingPanel(booking, briefing)}
                            className="px-4 py-2 rounded-md border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-semibold text-xs transition-all uppercase tracking-wider cursor-pointer"
                          >
                            View brief
                          </button>
                        ) : null}
                        {canJoin ? (
                          <Link
                            href={`/session/${booking.id}`}
                            data-testid={`booking-join-${booking.id}`}
                            className="px-4 py-2 rounded-md bg-primary hover:bg-primary-container text-white font-semibold text-xs transition-all uppercase tracking-wider shadow-sm"
                          >
                            Join video room
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    {booking.matchReason ? (
                      <div className="p-4 rounded-md bg-surface-container-low border border-outline-variant text-xs text-on-surface-variant mb-6">
                        <span className="font-semibold text-on-surface">Your goals: </span>
                        {booking.matchReason}
                      </div>
                    ) : null}

                    {isGenerating ? (
                      <div className="border-t border-surface-container pt-6">
                        <div className="flex items-center gap-4 p-4 rounded-md bg-primary/5 border border-primary/20 animate-ai-text-pulse">
                          <span className="relative flex h-3 w-3 shrink-0">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ai-glow" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-on-surface uppercase tracking-wide">
                              APX-02 is generating your brief
                            </p>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                              Panel open on the right — content appears when ready.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {sessionBriefing ? (
                      <div
                        data-testid={`booking-briefing-${booking.id}`}
                        className="border-t border-surface-container pt-6 space-y-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                            APX-02 session briefing
                          </h4>
                          <button
                            type="button"
                            onClick={() => openBriefingPanel(booking, sessionBriefing)}
                            className="text-[10px] font-semibold text-primary uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            Expand
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 rounded-md bg-surface-container-low border border-outline-variant/30">
                            <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                              Objectives
                            </span>
                            <ul className="list-disc pl-5 text-xs text-on-surface-variant space-y-1">
                              {sessionBriefing.session_objectives.slice(0, 2).map((obj) => (
                                <li key={obj}>{obj}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-4 rounded-md bg-surface-container-low border border-outline-variant/30">
                            <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                              Agenda preview
                            </span>
                            <p className="text-xs text-on-surface-variant leading-relaxed font-light line-clamp-3">
                              {sessionBriefing.recommended_agenda.minutes_0_5}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : briefing ? (
                      <div className="border-t border-surface-container pt-6 space-y-3">
                        <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                          APX-02 pre-call brief ready
                        </h4>
                        <BriefingContent briefing={briefing} />
                      </div>
                    ) : booking.status === 'confirmed' || booking.status === 'pending_payment' ? (
                      <div className="border-t border-surface-container pt-6 space-y-3">
                        <p className="text-xs text-on-surface-variant">
                          {skipPayments
                            ? 'No brief yet. Generate one now — a panel will open while APX-02 works.'
                            : 'Pre-session brief generates after payment clears.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => generateBriefing(booking)}
                          disabled={generatingId !== null}
                          className="px-4 py-2 rounded-md bg-primary hover:bg-primary-container text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          Generate briefing
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <BriefingSidebar state={sidebar} onClose={closeSidebar} />
    </>
  );
}
