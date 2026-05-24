'use client';

import React, { useState } from 'react';

export default function OnboardPage() {
  const [isCivilServant, setIsCivilServant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    employer: '',
    expertise: '',
    bio: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Connect to APX-04 /api/mentor/onboard
    setTimeout(() => {
      setLoading(false);
      alert('Onboarding submitted! ComplianceAgent (APX-04) is scanning and verifying credentials...');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-12 px-6">
      <div className="w-full max-w-xl border border-slate-900 bg-slate-950/80 p-8 rounded-2xl shadow-xl backdrop-blur-md relative">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Apply as an Aerospace Mentor</h2>
        <p className="text-slate-400 text-sm mb-6">
          AstraLink ensures strict compliance. If you are a civil servant, you will be required to upload your approved NASA Form NF-1860.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-200 focus:outline-none transition-colors"
              placeholder="e.g. Dr. Peggy Whitson"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-200 focus:outline-none transition-colors"
              placeholder="e.g. peggy@astrolink.ai"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Employer / Institution</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-200 focus:outline-none transition-colors"
              placeholder="e.g. NASA JSC, SpaceX, MIT"
              value={form.employer}
              onChange={(e) => setForm({ ...form, employer: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-900 bg-slate-900/35">
            <div>
              <h4 className="text-sm font-semibold text-white">Federal Civil Servant Status</h4>
              <p className="text-xs text-slate-400">Do you work directly for a federal agency or national lab?</p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
              checked={isCivilServant}
              onChange={(e) => setIsCivilServant(e.target.checked)}
            />
          </div>

          {isCivilServant && (
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/10">
              <label className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                NASA Form NF-1860 (Outside Employment Approval)
              </label>
              <p className="text-xs text-slate-400 mb-3">
                Upload a scanned PDF copy of your approved NF-1860 document. ComplianceAgent will parse it for supervisor signatures and expirations.
              </p>
              <input
                type="file"
                accept=".pdf"
                required
                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expertise Fields (comma-separated)</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-200 focus:outline-none transition-colors"
              placeholder="e.g. Guidance, Propulsion, Orbital Mechanics"
              value={form.expertise}
              onChange={(e) => setForm({ ...form, expertise: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Professional Biography</label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-200 focus:outline-none transition-colors resize-none"
              placeholder="Provide a detailed bio. Our scanner runs bio-risk analysis checks on civil servant signals."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-base transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {loading ? 'Analyzing Application...' : 'Submit & Connect Stripe'}
          </button>
        </form>
      </div>
    </div>
  );
}
