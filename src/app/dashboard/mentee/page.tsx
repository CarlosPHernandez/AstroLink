'use client';

import React from 'react';
import Link from 'next/link';

export default function MenteeDashboard() {
  // Mock bookings list
  const mockBookings = [
    {
      id: 'book-001',
      mentorName: 'Dr. Peggy Whitson',
      serviceType: 'session_1on1',
      scheduledAt: '2026-05-30T15:00:00Z',
      status: 'confirmed',
      matchReason: 'Dr. Peggy Whitson has significant NASA leadership experience aligned with your goals to work in astronaut operations.',
      briefing: {
        objectives: ['Review aerospace career development paths', 'Discuss operations protocols', 'Formulate a 12-month development checklist'],
        agenda: 'Minutes 0-5: Framing | Minutes 5-20: Operations Deep Dive | Minutes 20-30: Roadmap',
      },
    },
    {
      id: 'book-002',
      mentorName: 'Gwynne Shotwell',
      serviceType: 'resume_review',
      scheduledAt: '2026-06-05T10:00:00Z',
      status: 'confirmed',
      matchReason: 'Gwynne Shotwell possesses premier executive insight into commercial aerospace recruitment and resume benchmarks.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Mentee Command Center</h1>
            <p className="text-slate-400 text-sm">Monitor your upcoming calls, review briefs, and join video rooms.</p>
          </div>
          <Link
            href="/booking"
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all"
          >
            Book Another Session
          </Link>
        </header>

        <div className="space-y-8">
          {mockBookings.map((booking) => (
            <div key={booking.id} className="border border-slate-900 bg-slate-950/40 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-cyan-500/10 text-cyan-400 text-xs font-semibold rounded-bl-xl border-l border-b border-slate-900 uppercase">
                {booking.status}
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{booking.mentorName}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    {booking.serviceType.replace('_', ' ')} • {new Date(booking.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/session/${booking.id}`}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
                  >
                    Join Video Room
                  </Link>
                </div>
              </div>

              {booking.matchReason && (
                <div className="p-4 rounded-xl bg-slate-900/35 border border-slate-900 text-sm text-slate-300 mb-6">
                  <span className="font-semibold text-cyan-400">Match Logic: </span>
                  {booking.matchReason}
                </div>
              )}

              {booking.briefing ? (
                <div className="border-t border-slate-900 pt-6 space-y-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">APX-02 AI Session Briefing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="block text-xs font-medium text-slate-400 mb-2">Objectives:</span>
                      <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                        {booking.briefing.objectives.map((obj, idx) => (
                          <li key={idx}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-slate-400 mb-2">Recommended Agenda:</span>
                      <p className="text-sm text-slate-300 leading-relaxed">{booking.briefing.agenda}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-900 pt-6">
                  <span className="text-xs text-slate-500 italic">Resume review briefing is generated asynchronously once resume files are parsed.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
