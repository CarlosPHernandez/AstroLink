'use client';

import React, { useState, useActionState, startTransition } from 'react';
import { loginAction, registerAction } from './actions';

const PRESETS = {
  mentor: { email: 'peggy@astrolink.ai', fullName: 'Dr. Peggy Whitson', role: 'mentor' as const },
  mentee: { email: 'carlos@astrolink.ai', fullName: 'Carlos Hernandez', role: 'mentee' as const },
  admin: { email: 'admin@astrolink.ai', fullName: 'Flight Command', role: 'admin' as const },
};

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'mentee' | 'mentor' | 'admin'>('mentee');

  // React 19 useActionState hook for form submissions
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, undefined);
  const [registerState, registerFormAction, registerPending] = useActionState(registerAction, undefined);

  // Fast demo preset trigger
  const handlePresetClick = (email: string) => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', 'password123'); // Dummy pass for testing bypass
    startTransition(() => {
      loginFormAction(formData);
    });
  };

  const isPending = loginPending || registerPending;

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col justify-center items-center py-12 px-6 relative font-sans selection:bg-zinc-800 selection:text-white">
      {/* Premium minimal card */}
      <div className="w-full max-w-md border border-outline-variant bg-surface-container-lowest p-8 rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.01)] relative">
        
        <header className="text-center mb-8">
          {/* Brand Emblem */}
          <div className="inline-flex items-center justify-center w-8 h-8 bg-primary font-bold text-xs text-white rounded-md shadow-sm mb-3">
            A
          </div>
          <h2 className="text-lg font-bold uppercase tracking-wider text-on-surface">AstraLink Control Desk</h2>
          <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mt-1 font-mono">Executive Authentication Layer</p>
        </header>

        {/* Tab Selector */}
        <div className="flex border-b border-outline-variant mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'login'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Session Login
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'signup'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Display Error Message */}
        {activeTab === 'login' && loginState?.message && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container text-xs rounded-md">
            {loginState.message}
          </div>
        )}
        {activeTab === 'signup' && registerState?.message && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container text-xs rounded-md">
            {registerState.message}
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form action={loginFormAction} className="space-y-4">
            <div>
              <label className="block text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-1.5">Secure Email Address</label>
              <input
                type="email"
                name="email"
                required
                disabled={isPending}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary rounded-md text-on-surface focus:outline-none transition-all placeholder:text-zinc-400 text-xs font-light"
                placeholder="pilot@agency.gov"
              />
              {loginState?.errors?.email && (
                <p className="text-error text-[10px] mt-1">{loginState.errors.email[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-1.5">Access Key (Password)</label>
              <input
                type="password"
                name="password"
                required
                disabled={isPending}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary rounded-md text-on-surface focus:outline-none transition-all placeholder:text-zinc-400 text-xs font-light"
                placeholder="••••••••"
              />
              {loginState?.errors?.password && (
                <p className="text-error text-[10px] mt-1">{loginState.errors.password[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary transition-colors uppercase tracking-wider text-xs font-semibold rounded-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm animate-fade-in"
            >
              {isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Establish Downlink'
              )}
            </button>
          </form>
        )}

        {/* SIGNUP FORM */}
        {activeTab === 'signup' && (
          <form action={registerFormAction} className="space-y-4">
            <div>
              <label className="block text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-1.5">Role Target</label>
              <div className="grid grid-cols-2 gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => setRole('mentee')}
                  className={`py-2 px-3 border rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${
                    role === 'mentee'
                      ? 'bg-primary text-white border-primary'
                      : 'border-outline-variant text-on-surface-variant bg-surface-container-lowest hover:border-outline'
                  }`}
                >
                  Apply to Learn
                </button>
                <button
                  type="button"
                  onClick={() => setRole('mentor')}
                  className={`py-2 px-3 border rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${
                    role === 'mentor'
                      ? 'bg-primary text-white border-primary'
                      : 'border-outline-variant text-on-surface-variant bg-surface-container-lowest hover:border-outline'
                  }`}
                >
                  Apply to Instruct
                </button>
              </div>
              <input type="hidden" name="role" value={role} />
            </div>

            <div>
              <label className="block text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-1.5">Full Identity Name</label>
              <input
                type="text"
                name="fullName"
                required
                disabled={isPending}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary rounded-md text-on-surface focus:outline-none transition-all placeholder:text-zinc-400 text-xs font-light"
                placeholder="e.g. Carlos Hernandez"
              />
              {registerState?.errors?.fullName && (
                <p className="text-error text-[10px] mt-1">{registerState.errors.fullName[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-1.5">Official Email Address</label>
              <input
                type="email"
                name="email"
                required
                disabled={isPending}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary rounded-md text-on-surface focus:outline-none transition-all placeholder:text-zinc-400 text-xs font-light"
                placeholder="carlos@astrolink.ai"
              />
              {registerState?.errors?.email && (
                <p className="text-error text-[10px] mt-1">{registerState.errors.email[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-1.5">Set Access Key (Password)</label>
              <input
                type="password"
                name="password"
                required
                disabled={isPending}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary rounded-md text-on-surface focus:outline-none transition-all placeholder:text-zinc-400 text-xs font-light"
                placeholder="Min 6 characters"
              />
              {registerState?.errors?.password && (
                <p className="text-error text-[10px] mt-1">{registerState.errors.password[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary transition-colors uppercase tracking-wider text-xs font-semibold rounded-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deploying...
                </>
              ) : (
                'Establish Credentials'
              )}
            </button>
          </form>
        )}

        {/* DEMO / SIMULATION LOGINS PANEL */}
        <div className="mt-8 pt-6 border-t border-outline-variant">
          <div className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider text-center mb-3">
            Simulation Flight Presets (Single Click Link)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handlePresetClick(PRESETS.mentee.email)}
              className="flex flex-col items-center justify-center p-2.5 border border-outline-variant bg-surface-container-lowest hover:border-primary hover:bg-surface-container-low transition-all rounded-md group text-center cursor-pointer disabled:opacity-50"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mb-1" />
              <div className="text-[10px] font-bold text-on-surface-variant leading-none mb-0.5 group-hover:text-primary transition-colors">Mentee</div>
              <div className="text-[8px] font-mono text-zinc-400">Carlos H.</div>
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handlePresetClick(PRESETS.mentor.email)}
              className="flex flex-col items-center justify-center p-2.5 border border-outline-variant bg-surface-container-lowest hover:border-primary hover:bg-surface-container-low transition-all rounded-md group text-center cursor-pointer disabled:opacity-50"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mb-1" />
              <div className="text-[10px] font-bold text-on-surface-variant leading-none mb-0.5 group-hover:text-primary transition-colors">Mentor</div>
              <div className="text-[8px] font-mono text-zinc-400">Dr. Peggy W.</div>
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handlePresetClick(PRESETS.admin.email)}
              className="flex flex-col items-center justify-center p-2.5 border border-outline-variant bg-surface-container-lowest hover:border-primary hover:bg-surface-container-low transition-all rounded-md group text-center cursor-pointer disabled:opacity-50"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mb-1" />
              <div className="text-[10px] font-bold text-on-surface-variant leading-none mb-0.5 group-hover:text-primary transition-colors">Command</div>
              <div className="text-[8px] font-mono text-zinc-400">Admin</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
