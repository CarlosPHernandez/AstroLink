'use client';

import React from 'react';
import Link from 'next/link';

export default function MentorDashboard() {
  // Mock data representing database state
  const mentorProfile = {
    fullName: 'Dr. Peggy Whitson',
    email: 'peggy@astrolink.ai',
    complianceStatus: 'awaiting_human_approval', // pending_review | stripe_incomplete | awaiting_human_approval | approved
    stripeOnboardingCompleted: true,
  };

  const mockIncomingSessions = [
    {
      id: 'book-001',
      menteeName: 'Carlos Hernandez',
      serviceType: 'session_1on1',
      scheduledAt: '2026-05-30T15:00:00Z',
      status: 'confirmed',
      goals: 'I want to transition from traditional software engineering into flight software development at aerospace labs.',
      background: 'BS in Computer Science, 4 years experience building web systems and IoT platforms.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-900">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Mentor Portal</h1>
            <p className="text-slate-400 text-sm">Manage bookings, setup Stripe Express payouts, and download briefing packets.</p>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-900">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Compliance Status:</span>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg uppercase ${
              mentorProfile.complianceStatus === 'approved' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {mentorProfile.complianceStatus.replace(/_/g, ' ')}
            </span>
          </div>
        </header>

        {/* Action Panel */}
        {!mentorProfile.stripeOnboardingCompleted && (
          <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Link your bank account to enable payouts</h4>
              <p className="text-slate-400 text-sm">We process split payouts using Stripe Express. Complete onboarding to activate your account.</p>
            </div>
            <button
              onClick={() => alert('Redirecting to Stripe...')}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-all"
            >
              Complete Stripe Setup
            </button>
          </div>
        )}

        <h2 className="text-xl font-bold text-white mb-6">Upcoming Scheduled Sessions</h2>
        <div className="space-y-6">
          {mockIncomingSessions.map((session) => (
            <div key={session.id} className="border border-slate-900 bg-slate-950/40 p-6 rounded-2xl relative">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 text-xs font-semibold rounded-bl-xl border-l border-b border-slate-900 uppercase">
                {session.status}
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{session.menteeName}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    {session.serviceType.replace('_', ' ')} • {new Date(session.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Link
                    href={`/session/${session.id}`}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
                  >
                    Join Video Room
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-900/60">
                <div className="p-4 rounded-xl bg-slate-900/20 border border-slate-900/40">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mentee Background</span>
                  <p className="text-sm text-slate-300 leading-relaxed">{session.background}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/20 border border-slate-900/40">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mentee Goals</span>
                  <p className="text-sm text-slate-300 leading-relaxed">{session.goals}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
