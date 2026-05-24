import Link from 'next/link';

export default function StripeSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-12 px-6">
      <div className="w-full max-w-md border border-slate-900 bg-slate-950/80 p-8 rounded-2xl shadow-xl text-center backdrop-blur-md relative">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
        
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-3xl flex items-center justify-center mx-auto mb-6">
          ✓
        </div>
        
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Stripe Onboarding Complete</h2>
        <p className="text-slate-400 text-sm mb-8">
          Your Stripe Connect Express account has been set up. ComplianceAgent (APX-04) is reviewing your application details.
        </p>

        <div className="space-y-3">
          <Link
            href="/dashboard/mentor"
            className="block w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm transition-all duration-200"
          >
            Go to Mentor Dashboard
          </Link>
          <Link
            href="/"
            className="block w-full py-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white font-semibold text-sm transition-all duration-200"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
