'use client';

import React, { useState } from 'react';

export default function BookingPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    menteeName: '',
    menteeEmail: '',
    serviceType: 'session_1on1',
    goals: '',
    background: '',
    scheduledAt: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Connect to APX-01 /api/book
    setTimeout(() => {
      setLoading(false);
      alert('Booking submitted successfully! Agent APX-01 is processing...');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-12 px-6">
      <div className="w-full max-w-xl border border-slate-900 bg-slate-950/80 p-8 rounded-2xl shadow-xl backdrop-blur-md relative">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
        
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Book an Expert Session</h2>
        <p className="text-slate-400 text-sm mb-6">
          Share what you want to learn or decide. APX-01 will match you with the right aerospace expert and coordinate scheduling.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-slate-200 focus:outline-none transition-colors"
              placeholder="e.g. Neil Armstrong"
              value={form.menteeName}
              onChange={(e) => setForm({ ...form, menteeName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-slate-200 focus:outline-none transition-colors"
              placeholder="e.g. neil@nasa.gov"
              value={form.menteeEmail}
              onChange={(e) => setForm({ ...form, menteeEmail: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Session format</label>
            <select
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-slate-200 focus:outline-none transition-colors"
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
            >
              <option value="session_1on1">Expert session (30 min)</option>
              <option value="extended_session">Deep-dive expert session (60 min)</option>
              <option value="pre_call_brief">Pre-call brief package (async prep before your session)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Session Date & Time</label>
            <input
              type="datetime-local"
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-slate-200 focus:outline-none transition-colors"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Goals & questions for the expert</label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-slate-200 focus:outline-none transition-colors resize-none"
              placeholder="What do you want to learn, validate, or decide in this session?"
              value={form.goals}
              onChange={(e) => setForm({ ...form, goals: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your context (optional but helps matching)</label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-slate-200 focus:outline-none transition-colors resize-none"
              placeholder="Role, domain, and what led you to book this expert..."
              value={form.background}
              onChange={(e) => setForm({ ...form, background: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-base transition-all duration-200 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Proceed to Checkout'}
          </button>
        </form>
      </div>
    </div>
  );
}
