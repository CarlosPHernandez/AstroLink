'use client';

import React from 'react';
import Link from 'next/link';

export default function StripeRetryClient() {
  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col justify-center items-center p-4 sm:p-gutter relative font-sans selection:bg-primary-container selection:text-on-primary-container">
      <div className="w-full max-w-md border border-outline-variant bg-surface-container-lowest p-8 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.015)] text-center relative animate-reveal-up delay-100">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-3xl flex items-center justify-center mx-auto mb-6 shadow-sm font-semibold">
          !
        </div>

        <h2 className="text-lg font-bold uppercase tracking-wider text-on-surface mb-2">Stripe Onboarding Incomplete</h2>
        <p className="text-on-surface-variant text-xs leading-relaxed mb-8 font-light">
          The Stripe Express onboarding process was not completed. You will need to link your bank account to receive split consultation payouts.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => alert('Regenerating Stripe Connect OAuth parameters...')}
            className="block w-full py-3 rounded-lg bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm cursor-pointer"
          >
            Retry Connecting Account
          </button>
          <Link
            href="/"
            className="block w-full py-3 rounded-lg border border-outline-variant hover:border-outline bg-white text-on-surface-variant hover:text-on-surface font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm text-center cursor-pointer"
          >
            Cancel and Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
