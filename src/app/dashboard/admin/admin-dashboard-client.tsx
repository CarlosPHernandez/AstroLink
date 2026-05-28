'use client';

import React, { useState } from 'react';
import { logoutAction } from '@/app/auth/actions';

interface SessionData {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
}

export default function AdminDashboardClient({ session }: { session: SessionData }) {
  // Mock live audit logs
  const [logs, setLogs] = useState([
    {
      id: 'log-001',
      agent_id: 'APX-01',
      event: 'MATCHING_COMPLETED',
      ref_id: 'book-001',
      payload: { match_score: 0.94, mentor_id: 'mentor-123' },
      ts: new Date().toISOString(),
    },
    {
      id: 'log-002',
      agent_id: 'APX-04',
      event: 'BIO_RISK_SCANNED',
      ref_id: 'mentor-123',
      payload: { is_civil_servant: true, bio_risk_rating: 'medium' },
      ts: new Date().toISOString(),
    },
    {
      id: 'log-003',
      agent_id: 'APX-04',
      event: 'NF1860_PARSED',
      ref_id: 'mentor-123',
      payload: { supervisor_signature_present: true, center_director_signature_present: true },
      ts: new Date().toISOString(),
    },
  ]);

  // Mock pending compliance reviews
  const [reviews, setReviews] = useState([
    {
      id: 'review-001',
      mentorName: 'Dr. Peggy Whitson',
      employer: 'NASA JSC',
      bioRiskRating: 'medium',
      anomalies: ['None detected, signatures visible'],
      status: 'awaiting_human_approval',
    },
  ]);

  const approveMentor = (id: string) => {
    alert(`Mentor Approved: ${id}`);
    setReviews(reviews.filter((r) => r.id !== id));
  };

  const rejectMentor = (id: string) => {
    alert(`Mentor Rejected: ${id}`);
    setReviews(reviews.filter((r) => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-on-surface p-6 md:p-10 font-sans selection:bg-zinc-800 selection:text-white">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-outline-variant">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 text-[9px] font-mono bg-primary text-white rounded uppercase tracking-widest font-semibold">
                Flight Control Command
              </span>
              <span className="text-on-surface-variant text-xs font-mono">// System Online</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">
              Welcome back, <span className="font-light italic bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">{session.fullName}</span>
            </h1>
            <p className="text-on-surface-variant text-xs mt-1">Real-time telemetry, multi-agent status tracking, and compliance reviews.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="px-3 py-1.5 rounded-md border border-emerald-250 bg-emerald-50 text-xs font-semibold text-emerald-700 shadow-sm font-mono">
              SYSTEM ONLINE
            </span>

            {/* Logout Button */}
            <button
              onClick={() => logoutAction()}
              className="px-4 py-2 rounded-md border border-outline-variant hover:border-outline text-on-surface-variant hover:text-on-surface text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer bg-surface shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Telemetry Stream */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-md border border-outline-variant bg-surface-container-lowest shadow-[0_4px_25px_rgba(0,0,0,0.01)]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Real-time Agent Telemetry Feed
              </h2>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 rounded-md bg-surface-container-low border border-outline-variant text-xs">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-white">
                          {log.agent_id}
                        </span>
                        <span className="font-semibold text-on-surface uppercase tracking-wider font-mono text-[10px]">{log.event}</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-mono">{new Date(log.ts).toLocaleTimeString()}</span>
                    </div>
                    <pre className="text-xs text-on-surface-variant bg-surface-container-lowest p-3 rounded-md overflow-x-auto border border-outline-variant/35 font-mono max-h-40">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar / Right Columns */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Compliance Queue */}
            <div className="p-6 rounded-md border border-outline-variant bg-surface-container-lowest shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Compliance Queue
              </h2>
              
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-md bg-surface-container-low border border-outline-variant text-xs">
                      <h4 className="font-bold text-on-surface mb-1">{review.mentorName}</h4>
                      <p className="text-[10px] text-on-surface-variant mb-3">{review.employer} • Risk: <span className="text-amber-600 font-bold uppercase">{review.bioRiskRating}</span></p>
                      
                      <div className="text-[10px] text-on-surface-variant mb-4 bg-surface-container-lowest p-2.5 rounded-md border border-outline-variant/35">
                        <strong className="text-on-surface block mb-1">Extracted Anomalies:</strong>
                        {review.anomalies.map((a, idx) => <span key={idx}>{a}</span>)}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => approveMentor(review.id)}
                          className="flex-1 py-2 rounded-md bg-primary hover:bg-primary-container text-white font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectMentor(review.id)}
                          className="flex-1 py-2 rounded-md border border-outline-variant hover:bg-surface-container-lowest text-on-surface-variant font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm bg-white"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-on-surface-variant text-xs italic">Compliance review queue is clear.</p>
              )}
            </div>

            {/* Platform Metrics */}
            <div className="p-6 rounded-md border border-outline-variant bg-surface-container-lowest shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                Marketplace Health
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low border border-outline-variant p-4 rounded-md">
                  <span className="text-[9px] text-on-surface-variant uppercase block tracking-widest font-mono mb-1">Escrowed</span>
                  <span className="text-base font-bold text-on-surface">$1,240.00</span>
                </div>
                <div className="bg-surface-container-low border border-outline-variant p-4 rounded-md">
                  <span className="text-[9px] text-on-surface-variant uppercase block tracking-widest font-mono mb-1">Split Receipts</span>
                  <span className="text-base font-bold text-on-surface">$4,820.00</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
