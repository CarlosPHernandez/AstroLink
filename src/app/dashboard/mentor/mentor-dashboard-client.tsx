'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { logoutAction } from '@/app/auth/actions';

interface SessionData {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
}

export default function MentorDashboardClient({ session }: { session: SessionData }) {
  const isPeggy = session.email === 'peggy@astrolink.ai';

  // Active Tab state: consultations | payouts | profile | reports
  const [activeTab, setActiveTab] = useState<'consultations' | 'payouts' | 'profile' | 'reports'>('consultations');

  // Dynamic Profile State
  const [profile, setProfile] = useState({
    fullName: session.fullName,
    email: session.email,
    employer: isPeggy ? 'NASA / Axiom Space' : 'Aerospace Institute',
    complianceStatus: isPeggy ? 'approved' : 'stripe_incomplete', // approved | stripe_incomplete | awaiting_human_approval | document_required
    stripeOnboardingCompleted: isPeggy,
    isCivilServant: false,
    bio: isPeggy 
      ? 'Commanded the International Space Station twice. Expert in orbital workflow, astronaut operations, and life support systems engineering.' 
      : 'Consultant and engineer with a passion for aerospace.',
    expertise: isPeggy 
      ? 'Orbital Operations, EVA Protocols, Spacecraft Habitation' 
      : 'Avionics, Systems Engineering',
    rate: isPeggy ? 300 : 250,
  });

  const [saving, setSaving] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);

  // Fee calculation module inside Payouts Tab
  const [calculator, setCalculator] = useState({
    duration: 30, // minutes
  });

  // Calculate split pricing
  const totalCents = (profile.rate * (calculator.duration / 60)) * 100;
  const grossAmount = totalCents / 100;
  const platformFee = Math.round(grossAmount * 0.20 * 100) / 100; // 20% Split
  const mentorPayout = Math.round((grossAmount - platformFee) * 100) / 100; // 80% Split

  // Mock sessions state
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

  // Mock telemetry reports for Reports tab
  const mockTelemetryLogs = [
    {
      id: 'log-m1',
      agent: 'APX-04',
      event: 'BIO_RISK_SCANNED',
      details: 'Biographical review executed on ' + profile.fullName + '. Risk index: LOW.',
      ts: 'Just now'
    },
    {
      id: 'log-m2',
      agent: 'APX-01',
      event: 'STRIPE_CAP_INTEGRATED',
      details: profile.stripeOnboardingCompleted ? 'Split checkout routes active. Escrow hold checked.' : 'Awaiting Stripe payouts credentials.',
      ts: '10 minutes ago'
    },
    {
      id: 'log-m3',
      agent: 'APX-02',
      event: 'BRIEFING_PACKET_COMPILED',
      details: 'Compiled match briefings for Carlos Hernandez (objectives matched).',
      ts: '1 hour ago'
    }
  ];

  // Handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Flight profile updated and synced successfully!');
    }, 1000);
  };

  const triggerStripeSetup = () => {
    setStripeLoading(true);
    setTimeout(() => {
      setStripeLoading(false);
      setProfile(prev => ({
        ...prev,
        stripeOnboardingCompleted: true,
        complianceStatus: prev.isCivilServant && !pdfUploaded ? 'document_required' : 'awaiting_human_approval'
      }));
      alert('Stripe Connect onboarding simulated successfully! Bank payouts enabled.');
    }, 1500);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      setTimeout(() => {
        setUploading(false);
        setPdfUploaded(true);
        if (profile.stripeOnboardingCompleted) {
          setProfile(prev => ({ ...prev, complianceStatus: 'awaiting_human_approval' }));
        }
        alert('NASA Form NF-1860 uploaded. ComplianceAgent (APX-04) scanned and confirmed supervisor signatures!');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface p-6 md:p-10 font-sans selection:bg-zinc-800 selection:text-white">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-outline-variant">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 text-[9px] font-mono bg-primary text-white rounded uppercase tracking-widest font-semibold">
                Instructor Mode
              </span>
              <span className="text-on-surface-variant text-xs font-mono">// APX-04 Active</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">
              Welcome back, <span className="font-light italic bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">{profile.fullName}</span>
            </h1>
            <p className="text-on-surface-variant text-xs mt-1">Direct payout channels, profile security controls, and scheduled telemetry briefings.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Status Indicator */}
            <div className="flex items-center gap-3 bg-surface px-4 py-2 rounded-md border border-outline-variant shadow-sm">
              <span className="text-[9px] text-on-surface-variant uppercase tracking-wider block font-mono">Status:</span>
              <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase ${
                profile.complianceStatus === 'approved' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                  : profile.complianceStatus === 'awaiting_human_approval'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {profile.complianceStatus.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => logoutAction()}
              className="px-4 py-2 rounded-md border border-outline-variant hover:border-outline text-on-surface-variant hover:text-on-surface text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer bg-surface shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Dashboard Split Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* STICKY SIDEBAR NAVIGATION */}
          <aside className="lg:col-span-3 bg-surface border border-outline-variant rounded-md p-4 shadow-sm sticky top-24">
            <div className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest px-3 mb-4">
              Dashboard Navigation
            </div>
            
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('consultations')}
                className={`w-full text-left px-3 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'consultations'
                    ? 'bg-surface-container text-on-surface border-l-4 border-primary pl-2'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span>Consultations</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              </button>

              <button
                onClick={() => setActiveTab('payouts')}
                className={`w-full text-left px-3 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'payouts'
                    ? 'bg-surface-container text-on-surface border-l-4 border-primary pl-2'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span>Payouts & Bank</span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-3 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-surface-container text-on-surface border-l-4 border-primary pl-2'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span>Profile Settings</span>
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full text-left px-3 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-surface-container text-on-surface border-l-4 border-primary pl-2'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span>Reports & Telemetry</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </button>
            </nav>

            <div className="mt-8 pt-6 border-t border-outline-variant/30 px-3">
              <span className="block text-[9px] font-mono text-on-surface-variant uppercase tracking-widest">
                Stripe Express
              </span>
              <span className={`text-[10px] block mt-1.5 font-bold ${
                profile.stripeOnboardingCompleted ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {profile.stripeOnboardingCompleted ? '● Link Active' : '○ Action Required'}
              </span>
            </div>
          </aside>

          {/* MAIN TAB CONTENT PANEL */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* 1. CONSULTATIONS TAB */}
            {activeTab === 'consultations' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-outline-variant/35">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">
                    Active Scheduled Briefings
                  </h2>
                  <span className="text-[10px] font-mono text-on-surface-variant">1 Upcoming Consultation</span>
                </div>

                {mockIncomingSessions.map((session) => (
                  <div key={session.id} className="border border-outline-variant bg-surface-container-lowest p-6 rounded-md relative shadow-[0_4px_25px_rgba(0,0,0,0.01)]">
                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-surface-container-low text-on-surface-variant text-[9px] font-mono font-bold rounded-bl-md border-l border-b border-outline-variant uppercase">
                      {session.status}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-on-surface mb-1">{session.menteeName}</h3>
                        <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wide">
                          {session.serviceType.replace('_', ' ')} • {new Date(session.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Link
                          href={`/session/${session.id}`}
                          className="px-4 py-2.5 rounded-md bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-wider transition-all block text-center shadow-sm"
                        >
                          Join Video Room
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-surface-container">
                      <div className="p-4 rounded-md bg-surface-container-low/50 border border-outline-variant/20">
                        <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">Mentee Bio</span>
                        <p className="text-xs text-on-surface-variant leading-relaxed font-light">{session.background}</p>
                      </div>
                      <div className="p-4 rounded-md bg-surface-container-low/50 border border-outline-variant/20">
                        <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">Focus Objective</span>
                        <p className="text-xs text-on-surface-variant leading-relaxed font-light">{session.goals}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. PAYOUTS & BANK TAB */}
            {activeTab === 'payouts' && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-outline-variant/35">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">
                    Payout Gateways & split calculation
                  </h2>
                </div>

                {/* Stripe Action Panel */}
                <div className="p-6 rounded-md border border-outline-variant bg-surface shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-on-surface">Stripe Express Onboarding</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase font-mono ${
                        profile.stripeOnboardingCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {profile.stripeOnboardingCompleted ? 'Linked' : 'Pending Link'}
                      </span>
                    </div>
                    <p className="text-on-surface-variant text-xs leading-relaxed max-w-xl font-light">
                      AstraLink manages automated payouts directly using Stripe Express technology. Funds are held securely in escrow during bookings, then routed automatically on a 80% Mentor / 20% platform checkout split.
                    </p>
                  </div>
                  
                  {!profile.stripeOnboardingCompleted ? (
                    <button
                      onClick={triggerStripeSetup}
                      disabled={stripeLoading}
                      className="px-5 py-2.5 rounded-md bg-primary hover:bg-primary-container disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all flex-shrink-0 cursor-pointer shadow-sm"
                    >
                      {stripeLoading ? 'Connecting...' : 'Link Bank Payouts'}
                    </button>
                  ) : (
                    <div className="px-5 py-2.5 rounded-md bg-surface-container-low text-on-surface text-xs font-mono font-bold flex-shrink-0 uppercase border border-outline-variant">
                      ID: stripe_acct_active
                    </div>
                  )}
                </div>

                {/* Split Calculation Simulation */}
                <div className="p-6 rounded-md border border-outline-variant bg-surface shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Interactive Consultation Fee Calculator
                  </h3>
                  <p className="text-xs text-on-surface-variant mb-6 font-light">
                    AstraLink secures all funds in client escrow. Adjust duration below to see the split configuration based on your active billing rate of <strong className="text-on-surface">${profile.rate}/hr</strong>.
                  </p>

                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">Session Length (Minutes)</label>
                        <span className="text-xs font-bold text-on-surface">{calculator.duration} Min</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="120"
                        step="15"
                        value={calculator.duration}
                        onChange={(e) => setCalculator({ ...calculator, duration: Number(e.target.value) })}
                        className="w-full h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div className="pt-4 border-t border-surface-container grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-surface-container-low rounded-md border border-outline-variant/30">
                        <span className="text-[9px] text-on-surface-variant uppercase block font-mono tracking-wider mb-1">Gross Charged</span>
                        <span className="text-base font-bold text-on-surface">${grossAmount.toFixed(2)}</span>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-md border border-outline-variant/30">
                        <span className="text-[9px] text-on-surface-variant uppercase block font-mono tracking-wider mb-1">Platform (20%)</span>
                        <span className="text-base font-bold text-on-surface-variant">${platformFee.toFixed(2)}</span>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-md border border-outline-variant/30">
                        <span className="text-[9px] text-on-surface-variant uppercase block font-mono tracking-wider mb-1">Your Payout (80%)</span>
                        <span className="text-base font-bold text-primary">${mentorPayout.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PROFILE SETTINGS TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-outline-variant/35">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">
                    Flight Profile Configuration
                  </h2>
                </div>

                <div className="p-6 rounded-md border border-outline-variant bg-surface shadow-sm">
                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-1.5">Consultant Rate ($ / hour)</label>
                        <input
                          type="number"
                          required
                          value={profile.rate}
                          onChange={(e) => setProfile({ ...profile, rate: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary rounded-md text-xs text-on-surface focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-1.5">Employer / Agency</label>
                        <input
                          type="text"
                          required
                          value={profile.employer}
                          onChange={(e) => setProfile({ ...profile, employer: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary rounded-md text-xs text-on-surface focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-1.5">Expertise Tags (comma-separated)</label>
                      <input
                        type="text"
                        required
                        value={profile.expertise}
                        onChange={(e) => setProfile({ ...profile, expertise: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary rounded-md text-xs text-on-surface focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-1.5">Biography Description</label>
                      <textarea
                        rows={5}
                        required
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary rounded-md text-xs text-on-surface focus:outline-none transition-colors resize-none leading-relaxed font-light"
                      />
                    </div>

                    {/* Civil Servant Toggle */}
                    <div className="p-4 rounded-md border border-outline-variant bg-surface-container-low/50 flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-semibold text-on-surface">Active Federal Civil Servant</h5>
                        <p className="text-[10px] text-on-surface-variant">Do you require NASA Form NF-1860 (Outside Consulting Approval)?</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.isCivilServant}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setProfile(prev => ({
                            ...prev,
                            isCivilServant: checked,
                            complianceStatus: checked && !pdfUploaded ? 'document_required' : prev.complianceStatus
                          }));
                        }}
                        className="w-4 h-4 text-primary border-outline-variant bg-surface rounded focus:ring-primary focus:ring-offset-surface cursor-pointer"
                      />
                    </div>

                    {/* NF-1860 Scanned PDF Upload Box */}
                    {profile.isCivilServant && (
                      <div className="p-4 rounded-md border border-outline-variant bg-surface-container-low space-y-2.5">
                        <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
                          NASA Form NF-1860 Approval Scans
                        </span>
                        <p className="text-[10px] text-on-surface-variant leading-normal font-light">
                          Upload Outside Employment paperwork. APX-04 extracts clearance credentials and maps expiry parameters automatically.
                        </p>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handlePdfUpload}
                          className="w-full text-xs text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-outline-variant file:border file:text-[9px] file:font-bold file:uppercase file:bg-white file:text-on-surface hover:file:bg-surface-container-low file:cursor-pointer transition-colors"
                        />
                        {uploading && <div className="text-[9px] text-on-surface-variant font-mono animate-pulse">Running document scanner loops...</div>}
                        {pdfUploaded && <div className="text-[9px] text-emerald-600 font-mono font-semibold">✓ Document scanned and signatures confirmed!</div>}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-2.5 bg-primary hover:bg-primary-container text-white transition-colors uppercase tracking-wider text-xs font-semibold rounded-md cursor-pointer shadow-sm"
                    >
                      {saving ? 'Saving...' : 'Sync Profile Changes'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 4. REPORTS & TELEMETRY TAB */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-outline-variant/35 flex justify-between items-center">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">
                    Compliance telemetry & briefing packets
                  </h2>
                  <span className="text-[9px] font-mono text-on-surface-variant">Telemetry Online</span>
                </div>

                {/* Audit telemetries */}
                <div className="p-6 rounded-md border border-outline-variant bg-surface shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Biographical telemetry & security logs
                  </h3>

                  <div className="space-y-3.5">
                    {mockTelemetryLogs.map((log) => (
                      <div key={log.id} className="p-4 rounded-md bg-surface-container-low border border-outline-variant text-xs flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-primary text-white">
                              {log.agent}
                            </span>
                            <span className="font-bold text-on-surface uppercase tracking-widest font-mono text-[9px]">{log.event}</span>
                          </div>
                          <p className="text-on-surface-variant font-light leading-relaxed">{log.details}</p>
                        </div>
                        <span className="text-[9px] font-mono text-on-surface-variant flex-shrink-0">{log.ts}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Briefing telemetries */}
                <div className="p-6 rounded-md border border-outline-variant bg-surface shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3">
                    Instruction Telemetries
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                    The APX system monitors communications, scheduled timings, and briefing packets to help improve flight software consultation quality.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-low border border-outline-variant p-4 rounded-md text-center">
                      <span className="text-[9px] text-on-surface-variant uppercase block font-mono tracking-widest mb-1">Match Quality Index</span>
                      <span className="text-lg font-bold text-on-surface">98.2%</span>
                    </div>
                    <div className="bg-surface-container-low border border-outline-variant p-4 rounded-md text-center">
                      <span className="text-[9px] text-on-surface-variant uppercase block font-mono tracking-widest mb-1">Tele-Session Duration</span>
                      <span className="text-lg font-bold text-on-surface">30 Min (Escrow locked)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>

        </div>
      </div>
    </div>
  );
}
