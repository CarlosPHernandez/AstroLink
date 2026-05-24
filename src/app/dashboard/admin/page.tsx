'use client';

import React, { useState } from 'react';

export default function AdminDashboard() {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 pb-6 border-b border-slate-900 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Agent Command Center</h1>
            <p className="text-slate-400 text-sm">Real-time telemetry, multi-agent status tracking, and compliance reviews.</p>
          </div>
          <span className="px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-xs font-semibold text-emerald-400">
            SYSTEM ONLINE
          </span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Telemetry Stream */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40">
              <h2 className="text-xl font-bold text-white mb-4">Real-time Agent Telemetry Feed</h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 text-sm">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400">
                          {log.agent_id}
                        </span>
                        <span className="font-semibold text-slate-200">{log.event}</span>
                      </div>
                      <span className="text-xs text-slate-500">{new Date(log.ts).toLocaleTimeString()}</span>
                    </div>
                    <pre className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-lg overflow-x-auto border border-slate-900">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Compliance & Escalation Columns */}
          <div className="space-y-8">
            {/* Compliance Approvals queue */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40">
              <h2 className="text-xl font-bold text-white mb-4">Compliance Queue</h2>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-xl bg-slate-900/20 border border-slate-900 text-sm">
                      <h4 className="font-bold text-white mb-1">{review.mentorName}</h4>
                      <p className="text-xs text-slate-400 mb-3">{review.employer} • Risk: <span className="text-amber-400 font-semibold">{review.bioRiskRating}</span></p>
                      
                      <div className="text-xs text-slate-400 mb-4 bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                        <strong className="text-slate-300 block mb-1">Extracted Anomalies:</strong>
                        {review.anomalies.map((a, idx) => <span key={idx}>{a}</span>)}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => approveMentor(review.id)}
                          className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectMentor(review.id)}
                          className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm italic">Compliance review queue is clear.</p>
              )}
            </div>

            {/* Platform Metrics */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40">
              <h2 className="text-xl font-bold text-white mb-4">Marketplace Health</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/35 border border-slate-900 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase block tracking-wider mb-1">Escrowed Funds</span>
                  <span className="text-lg font-bold text-cyan-400">$1,240.00</span>
                </div>
                <div className="bg-slate-900/35 border border-slate-900 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase block tracking-wider mb-1">Completed Split</span>
                  <span className="text-lg font-bold text-indigo-400">$4,820.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
