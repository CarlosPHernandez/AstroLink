'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { BookingSessionView } from '@/lib/booking-access';
import type { MentorBriefingOutput } from '@/lib/types';

function isSessionBriefing(
  briefing: BookingSessionView['briefing']
): briefing is MentorBriefingOutput {
  return briefing !== null && 'session_objectives' in briefing;
}

export default function SessionRoomClient({ booking }: { booking: BookingSessionView }) {
  const [ended, setEnded] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/mentee" className="text-slate-400 hover:text-slate-200 text-sm">
            ← Exit call
          </Link>
          <span className="text-slate-500">|</span>
          <span className="font-bold text-white tracking-tight">
            Session with {booking.mentorName}
          </span>
        </div>
        <span className="text-xs font-mono text-slate-500 uppercase">{booking.status}</span>
      </header>

      <div className="flex-grow flex flex-col lg:flex-row">
        <div className="flex-grow bg-slate-900/40 flex items-center justify-center p-8 border-r border-slate-900">
          {!ended && booking.dailyRoomUrl ? (
            <div className="w-full max-w-4xl aspect-video rounded-2xl border border-slate-800 overflow-hidden bg-black">
              <iframe
                src={booking.dailyRoomUrl}
                allow="camera; microphone; fullscreen; display-capture"
                className="w-full h-full min-h-[360px]"
                title="AstroLink video session"
              />
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setEnded(true)}
                  className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold"
                >
                  End session
                </button>
              </div>
            </div>
          ) : !booking.dailyRoomUrl ? (
            <p className="text-slate-400 text-sm max-w-md text-center">
              Video room is not ready yet. Confirm payment completed and refresh your dashboard.
            </p>
          ) : (
            <div className="text-center max-w-md p-8 border border-slate-900 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-2">Session ended</h3>
              <p className="text-slate-400 text-sm mb-6">
                Post-session synthesis (APX-03) will run when Daily webhooks are wired.
              </p>
              <Link
                href="/dashboard/mentee"
                className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
              >
                Back to dashboard
              </Link>
            </div>
          )}
        </div>

        <aside className="w-full lg:w-96 p-6 space-y-6 bg-slate-950/50">
          <h3 className="text-lg font-bold text-white">Session briefing</h3>
          {isSessionBriefing(booking.briefing) ? (
            <ul className="space-y-2 text-xs text-slate-300">
              {booking.briefing.session_objectives.map((obj) => (
                <li key={obj}>• {obj}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">Briefing not available for this booking.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
