'use client';

import React from 'react';
import Link from 'next/link';
import { logoutAction } from '@/app/auth/actions';

interface SessionData {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
}

export default function MenteeDashboardClient({ session }: { session: SessionData }) {
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
    <div className="min-h-screen bg-background text-on-surface p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-outline-variant">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 text-[9px] font-mono bg-primary text-white rounded uppercase tracking-widest font-semibold">
                Mentee Command Center
              </span>
              <span className="text-on-surface-variant text-xs font-mono">// Session Active</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">
              Hello, <span className="font-light italic bg-gradient-to-r from-black via-zinc-800 to-zinc-600 bg-clip-text text-transparent">{session.fullName}</span>
            </h1>
            <p className="text-on-surface-variant text-xs mt-1">Monitor your upcoming calls, review briefs, and join video rooms.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="/booking"
              className="px-5 py-2.5 rounded-md bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
            >
              Book Another Session
            </Link>
            
            <button
              onClick={() => logoutAction()}
              className="px-4 py-2 rounded-md border border-outline-variant hover:border-outline text-on-surface-variant hover:text-on-surface text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer bg-surface shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Bookings List */}
        <div className="space-y-8">
          {mockBookings.map((booking) => (
            <div key={booking.id} className="border border-outline-variant bg-surface-container-lowest p-6 rounded-md relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-surface-container-low text-on-surface-variant text-[9px] font-mono font-bold rounded-bl-md border-l border-b border-outline-variant uppercase">
                {booking.status}
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-on-surface mb-1">{booking.mentorName}</h3>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wide">
                    {booking.serviceType.replace('_', ' ')} • {new Date(booking.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/session/${booking.id}`}
                    className="px-4 py-2 rounded-md bg-primary hover:bg-primary-container text-white font-semibold text-xs transition-all uppercase tracking-wider shadow-sm"
                  >
                    Join Video Room
                  </Link>
                </div>
              </div>

              {booking.matchReason && (
                <div className="p-4 rounded-md bg-surface-container-low border border-outline-variant text-xs text-on-surface-variant mb-6">
                  <span className="font-semibold text-on-surface">Match Logic: </span>
                  {booking.matchReason}
                </div>
              )}

              {booking.briefing ? (
                <div className="border-t border-surface-container pt-6 space-y-4">
                  <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">APX-02 AI Session Briefing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-md bg-surface-container-low border border-outline-variant/30">
                      <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">Objectives:</span>
                      <ul className="list-disc pl-5 text-xs text-on-surface-variant space-y-1">
                        {booking.briefing.objectives.map((obj, idx) => (
                          <li key={idx}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-md bg-surface-container-low border border-outline-variant/30">
                      <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">Recommended Agenda:</span>
                      <p className="text-xs text-on-surface-variant leading-relaxed font-light">{booking.briefing.agenda}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-surface-container pt-6">
                  <span className="text-xs text-on-surface-variant italic">Resume review briefing is generated asynchronously once resume files are parsed.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
