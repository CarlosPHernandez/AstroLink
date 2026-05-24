'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SessionPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [meetingEnded, setMeetingEnded] = useState(false);

  useEffect(() => {
    params.then((p) => setBookingId(p.bookingId));
  }, [params]);

  const endMeetingMock = () => {
    setMeetingEnded(true);
    alert('Meeting concluded! Daily.co webhook triggered. PaymentAgent (APX-05) and SessionAgent (APX-03) running...');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/mentee" className="text-slate-400 hover:text-slate-200 transition-colors text-sm">
            ← Exit Call
          </Link>
          <span className="text-slate-500 font-medium">|</span>
          <span className="font-bold text-white tracking-tight">Active Mentoring Call: {bookingId}</span>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
      </header>

      <div className="flex-grow flex flex-col lg:flex-row">
        {/* Video Canvas */}
        <div className="flex-grow bg-slate-900/40 flex items-center justify-center p-8 border-r border-slate-900 relative">
          {!meetingEnded ? (
            <div className="w-full max-w-3xl aspect-video rounded-2xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-indigo-500/5" />
              <p className="text-slate-400 font-medium text-lg mb-4">Daily.co Active Video Stream</p>
              <button
                onClick={endMeetingMock}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all"
              >
                Conclude Meeting
              </button>
            </div>
          ) : (
            <div className="text-center max-w-md p-8 border border-slate-900 bg-slate-950/80 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-3xl flex items-center justify-center mx-auto mb-6">
                ✓
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Meeting Concluded Successfully</h3>
              <p className="text-slate-400 text-sm mb-6">
                Thank you for participating! Our agents are currently processing the audio transcript and generating the post-session synthesis.
              </p>
              <Link
                href="/dashboard/mentee"
                className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
              >
                Return to Dashboard
              </Link>
            </div>
          )}
        </div>

        {/* Briefing Sidebar */}
        <div className="w-full lg:w-96 p-6 space-y-6 bg-slate-950/50 backdrop-blur-sm">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Session Briefing</h3>
            <p className="text-xs text-slate-500">APX-02 custom agenda pack</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/10">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recommended Agenda</h4>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex justify-between items-start gap-3">
                  <span className="font-semibold text-cyan-400 min-w-[50px]">0-5 Min</span>
                  <span>Frame session goals and define specific technical outcomes.</span>
                </li>
                <li className="flex justify-between items-start gap-3">
                  <span className="font-semibold text-cyan-400 min-w-[50px]">5-20 Min</span>
                  <span>Deep dive into flight software systems design and integration.</span>
                </li>
                <li className="flex justify-between items-start gap-3">
                  <span className="font-semibold text-cyan-400 min-w-[50px]">20-28 Min</span>
                  <span>Discuss active research development resources.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/10">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes Template</h4>
              <textarea
                rows={5}
                className="w-full p-3 text-xs bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg focus:outline-none text-slate-300 resize-none"
                placeholder="Take notes here during your conversation..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
