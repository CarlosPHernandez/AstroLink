import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/require-session';

export default async function StripeSuccessPage() {
  await requireRole('mentor');

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col justify-center items-center p-4 sm:p-gutter relative font-sans selection:bg-primary-container selection:text-on-primary-container">
      
      {/* Outer Card Wrapper */}
      <div className="w-full max-w-md border border-outline-variant bg-surface-container-lowest p-8 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.015)] text-center relative animate-reveal-up delay-100">
        
        {/* Soft Ambient Glow */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        {/* Success Icon Badge */}
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          ✓
        </div>
        
        <h2 className="text-lg font-bold uppercase tracking-wider text-on-surface mb-2">Stripe Onboarding Complete</h2>
        <p className="text-on-surface-variant text-xs leading-relaxed mb-8 font-light">
          Your Stripe Connect Express payout account has been initialized. Our compliance review is checking your aerospace credentials.
        </p>

        <div className="space-y-3">
          <Link
            href="/dashboard/mentor"
            className="block w-full py-3 rounded-lg bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm text-center cursor-pointer"
          >
            Go to Mentor Dashboard
          </Link>
          <Link
            href="/"
            className="block w-full py-3 rounded-lg border border-outline-variant hover:border-outline bg-white text-on-surface-variant hover:text-on-surface font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm text-center cursor-pointer"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
