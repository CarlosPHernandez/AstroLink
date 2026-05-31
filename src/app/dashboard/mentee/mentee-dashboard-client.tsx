'use client';

import React from 'react';
import Link from 'next/link';
import { logoutAction } from '@/app/auth/actions';
import type { MenteeBookingView } from '@/lib/mentee-bookings';
import { SERVICE_TYPE_LABELS, type MentorBriefingOutput, type ServiceType } from '@/lib/types';

interface SessionData {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
}

function isSessionBriefing(
  briefing: MenteeBookingView['briefing']
): briefing is MentorBriefingOutput {
  return briefing !== null && 'session_objectives' in briefing;
}

export default function MenteeDashboardClient({
  session,
  bookings,
}: {
  session: SessionData;
  bookings: MenteeBookingView[];
}) {
  return (
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
              const briefing = isSessionBriefing(booking.briefing) ? booking.briefing : null;
              const canJoin =
                booking.dailyRoomUrl &&
                (booking.status === 'confirmed' || booking.status === 'completed');

              return (
                <div
                  key={booking.id}
                  className="border border-outline-variant bg-surface-container-lowest p-6 rounded-md relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)]"
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
                    {canJoin ? (
                      <Link
                        href={`/session/${booking.id}`}
                        className="px-4 py-2 rounded-md bg-primary hover:bg-primary-container text-white font-semibold text-xs transition-all uppercase tracking-wider shadow-sm"
                      >
                        Join video room
                      </Link>
                    ) : null}
                  </div>

                  {booking.matchReason ? (
                    <div className="p-4 rounded-md bg-surface-container-low border border-outline-variant text-xs text-on-surface-variant mb-6">
                      <span className="font-semibold text-on-surface">Your goals: </span>
                      {booking.matchReason}
                    </div>
                  ) : null}

                  {briefing ? (
                    <div className="border-t border-surface-container pt-6 space-y-4">
                      <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                        APX-02 session briefing
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 rounded-md bg-surface-container-low border border-outline-variant/30">
                          <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                            Objectives
                          </span>
                          <ul className="list-disc pl-5 text-xs text-on-surface-variant space-y-1">
                            {briefing.session_objectives.map((obj) => (
                              <li key={obj}>{obj}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 rounded-md bg-surface-container-low border border-outline-variant/30">
                          <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                            Agenda
                          </span>
                          <p className="text-xs text-on-surface-variant leading-relaxed font-light">
                            {briefing.recommended_agenda.minutes_0_5} ·{' '}
                            {briefing.recommended_agenda.minutes_5_20} ·{' '}
                            {briefing.recommended_agenda.minutes_20_28}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : booking.status === 'confirmed' || booking.status === 'pending_payment' ? (
                    <div className="border-t border-surface-container pt-6">
                      <span className="text-xs text-on-surface-variant italic">
                        Pre-session brief is generating — refresh shortly after payment clears.
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
