'use client';

import React, { useState, useActionState, startTransition } from 'react';
import { loginAction, registerAction } from './actions';

const PRESETS = {
  mentor: { email: 'chris@astrolink.ai', fullName: 'Chris Sembroski', role: 'mentor' as const },
  mentee: { email: 'carlos@astrolink.ai', fullName: 'Carlos Hernandez', role: 'mentee' as const },
  admin: { email: 'admin@astrolink.ai', fullName: 'Flight Command', role: 'admin' as const },
};

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'mentee' | 'mentor' | 'admin'>('mentee');
  const [socialAlert, setSocialAlert] = useState<string | null>(null);

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

  const handleSocialClick = (platform: string) => {
    setSocialAlert(`Social Auth via ${platform} is bypassed for the simulation. Please use the Email login or click one of the Simulation Flight Presets below.`);
    setTimeout(() => setSocialAlert(null), 6000);
  };

  const isPending = loginPending || registerPending;

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col justify-center items-center p-4 sm:p-gutter relative font-sans selection:bg-primary-container selection:text-on-primary-container">
      
      {/* Auth Container */}
      <main className="w-full max-w-[420px] animate-reveal-up delay-100">
        
        {/* Brand / Header */}
        <div className="mb-6 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-md shadow-[0_4px_20px_rgba(0,88,188,0.15)] animate-reveal-down delay-200 group relative cursor-pointer">
            <div className="pulse-ring absolute inset-0 bg-primary/20 rounded-full"></div>
            <div className="pulse-ring absolute inset-0 bg-primary/10 rounded-full" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-[132px] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-inverse-surface text-inverse-on-surface text-[10px] px-3 py-1.5 rounded-lg shadow-lg z-10 flex">
              <span className="typewriter-text font-mono inline-block">Welcome to the future, Voyager</span>
            </div>
            <span className="material-symbols-outlined text-on-primary" style={{ fontSize: '28px' }}>satellite_alt</span>
          </div>
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight mb-xs animate-reveal-up delay-300">
            AstralLink
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant animate-reveal-up delay-400">
            {activeTab === 'login' ? 'Sign in to your account' : 'Create your credentials'}
          </p>
        </div>

        {/* Outer Card Wrapper */}
        <div className="bg-surface-container-lowest border border-outline-variant p-5 sm:p-8 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.015)] animate-reveal-up delay-300">
          
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

          {/* Toast / Notification Banner for Mock Social Logins */}
          {socialAlert && (
            <div className="mb-4 p-3 bg-primary-container/10 border border-primary-container/20 text-primary text-xs rounded-lg animate-fade-in">
              {socialAlert}
            </div>
          )}

          {/* Display Error Message */}
          {activeTab === 'login' && loginState?.message && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container text-xs rounded-lg">
              {loginState.message}
            </div>
          )}
          {activeTab === 'signup' && registerState?.message && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container text-xs rounded-lg">
              {registerState.message}
            </div>
          )}

          {/* Social Logins - Grid layout for better responsiveness */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm mb-lg animate-reveal-up delay-500">
            <button 
              type="button"
              onClick={() => handleSocialClick('Google')}
              className="w-full flex items-center justify-center gap-sm py-sm px-md border border-outline-variant rounded-lg bg-surface-container-lowest hover:bg-surface transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
            >
              <svg className="w-5 h-5 text-on-surface group-hover:scale-105 transition-transform" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="font-label-md text-label-md text-on-surface">Google</span>
            </button>
            <button 
              type="button"
              onClick={() => handleSocialClick('X')}
              className="w-full flex items-center justify-center gap-sm py-sm px-md border border-outline-variant rounded-lg bg-surface-container-lowest hover:bg-surface transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
            >
              <svg className="w-5 h-5 text-on-surface group-hover:scale-105 transition-transform" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
              <span className="font-label-md text-label-md text-on-surface">Twitter / X</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center mb-lg animate-reveal-up delay-[600ms]">
            <div className="flex-grow border-t border-surface-variant"></div>
            <span className="flex-shrink-0 mx-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Or continue with</span>
            <div className="flex-grow border-t border-surface-variant"></div>
          </div>

          {/* Form Content */}
          {activeTab === 'login' ? (
            <form action={loginFormAction} className="flex flex-col gap-md animate-reveal-up delay-[700ms]">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface mb-xs" htmlFor="email">Email address</label>
                <input 
                  className="w-full py-sm px-md font-body-md text-body-md bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow" 
                  id="email" 
                  name="email" 
                  placeholder="name@company.com" 
                  required 
                  type="email"
                  disabled={isPending}
                />
                {loginState?.errors?.email && (
                  <p className="text-error text-[10px] mt-1">{loginState.errors.email[0]}</p>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center mb-xs">
                  <label className="block font-label-sm text-label-sm text-on-surface" htmlFor="password">Password</label>
                  <a className="font-label-sm text-label-sm text-primary hover:text-on-primary-fixed-variant transition-colors" href="#">Forgot password?</a>
                </div>
                <input 
                  className="w-full py-sm px-md font-body-md text-body-md bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type="password"
                  disabled={isPending}
                />
                {loginState?.errors?.password && (
                  <p className="text-error text-[10px] mt-1">{loginState.errors.password[0]}</p>
                )}
              </div>
              <button 
                className="mt-xs w-full py-sm px-md bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-on-primary-fixed-variant transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex justify-center items-center gap-xs group/btn cursor-pointer disabled:opacity-50" 
                type="submit"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Sign In
                    <span className="material-symbols-outlined group-hover/btn:translate-x-1 transition-transform" style={{ fontSize: '18px' }}>arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form action={registerFormAction} className="flex flex-col gap-md animate-reveal-up delay-[700ms]">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface mb-xs">Role Target</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('mentee')}
                    className={`py-2 px-3 border rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
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
                    className={`py-2 px-3 border rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
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
                <label className="block font-label-sm text-label-sm text-on-surface mb-xs" htmlFor="fullName">Full Identity Name</label>
                <input 
                  className="w-full py-sm px-md font-body-md text-body-md bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow" 
                  id="fullName" 
                  name="fullName" 
                  placeholder="e.g. Carlos Hernandez" 
                  required 
                  type="text"
                  disabled={isPending}
                />
                {registerState?.errors?.fullName && (
                  <p className="text-error text-[10px] mt-1">{registerState.errors.fullName[0]}</p>
                )}
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-on-surface mb-xs" htmlFor="regEmail">Official Email address</label>
                <input 
                  className="w-full py-sm px-md font-body-md text-body-md bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow" 
                  id="regEmail" 
                  name="email" 
                  placeholder="name@company.com" 
                  required 
                  type="email"
                  disabled={isPending}
                />
                {registerState?.errors?.email && (
                  <p className="text-error text-[10px] mt-1">{registerState.errors.email[0]}</p>
                )}
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-on-surface mb-xs" htmlFor="regPassword">Access Key (Password)</label>
                <input 
                  className="w-full py-sm px-md font-body-md text-body-md bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow" 
                  id="regPassword" 
                  name="password" 
                  placeholder="Min 6 characters" 
                  required 
                  type="password"
                  disabled={isPending}
                />
                {registerState?.errors?.password && (
                  <p className="text-error text-[10px] mt-1">{registerState.errors.password[0]}</p>
                )}
              </div>

              <button 
                className="mt-xs w-full py-sm px-md bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-on-primary-fixed-variant transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex justify-center items-center gap-xs group/btn cursor-pointer disabled:opacity-50" 
                type="submit"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    Create Account
                    <span className="material-symbols-outlined group-hover/btn:translate-x-1 transition-transform" style={{ fontSize: '18px' }}>arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* DEMO / SIMULATION LOGINS PANEL */}
          <div className="mt-8 pt-6 border-t border-outline-variant animate-reveal-up delay-800">
            <div className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider text-center mb-3">
              Simulation Flight Presets (One-Click Bypass)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handlePresetClick(PRESETS.mentee.email)}
                className="flex flex-col items-center justify-center p-2 border border-outline-variant bg-surface-container-lowest hover:border-primary hover:bg-surface-container-low transition-all rounded-lg group text-center cursor-pointer disabled:opacity-50"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mb-1" />
                <div className="text-[10px] font-bold text-on-surface-variant leading-none mb-1 group-hover:text-primary transition-colors">Mentee</div>
                <div className="text-[8px] font-mono text-zinc-400 truncate w-full">Carlos H.</div>
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handlePresetClick(PRESETS.mentor.email)}
                className="flex flex-col items-center justify-center p-2 border border-outline-variant bg-surface-container-lowest hover:border-primary hover:bg-surface-container-low transition-all rounded-lg group text-center cursor-pointer disabled:opacity-50"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mb-1" />
                <div className="text-[10px] font-bold text-on-surface-variant leading-none mb-1 group-hover:text-primary transition-colors">Mentor</div>
                <div className="text-[8px] font-mono text-zinc-400 truncate w-full">Chris S.</div>
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handlePresetClick(PRESETS.admin.email)}
                className="flex flex-col items-center justify-center p-2 border border-outline-variant bg-surface-container-lowest hover:border-primary hover:bg-surface-container-low transition-all rounded-lg group text-center cursor-pointer disabled:opacity-50"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mb-1" />
                <div className="text-[10px] font-bold text-on-surface-variant leading-none mb-1 group-hover:text-primary transition-colors">Admin</div>
                <div className="text-[8px] font-mono text-zinc-400 truncate w-full">Flight Ops</div>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Footer Link */}
        <div className="mt-6 text-center font-body-md text-body-md text-on-surface-variant animate-reveal-up delay-[800ms]">
          {activeTab === 'login' ? (
            <>
              Don't have an account?{' '}
              <button 
                onClick={() => setActiveTab('signup')}
                className="font-label-md text-label-md text-primary hover:text-on-primary-fixed-variant transition-colors cursor-pointer"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have credentials?{' '}
              <button 
                onClick={() => setActiveTab('login')}
                className="font-label-md text-label-md text-primary hover:text-on-primary-fixed-variant transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </>
          )}
        </div>

      </main>

    </div>
  );
}
