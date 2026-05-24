'use client';

import Link from 'next/link';

export default function StripeRetryPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-12 px-6">
      <div className="w-full max-w-md border border-slate-900 bg-slate-950/80 p-8 rounded-2xl shadow-xl text-center backdrop-blur-md relative">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -z-10" />
        
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-3xl flex items-center justify-center mx-auto mb-6">
          !
        </div>
        
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Stripe Onboarding Incomplete</h2>
        <p className="text-slate-400 text-sm mb-8">
          The Stripe Express onboarding process was not completed. You will need to link your bank account to receive split payouts.
        </p>

        <div className="space-y-3">
          <button
            className="block w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-sm transition-all duration-200"
            onClick={() => alert('Regenerating Stripe Onboarding Link...')}
          >
            Retry Connecting Account
          </button>
          <Link
            href="/"
            className="block w-full py-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white font-semibold text-sm transition-all duration-200"
          >
            Cancel and Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
