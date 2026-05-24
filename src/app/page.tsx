import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-cyan-500/20">
            A
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            AstraLink AI
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/dashboard/admin" className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">
            Command Center
          </Link>
          <Link href="/dashboard/mentee" className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">
            Mentee Panel
          </Link>
          <Link href="/dashboard/mentor" className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">
            Mentor Panel
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center max-w-5xl mx-auto px-6 py-20 text-center sm:text-left">
        <div className="relative">
          {/* Decorative ambient blobs */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
          <div className="absolute top-20 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
          
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-xs font-semibold text-cyan-400 tracking-wide mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            XPrize Build with Google Gemini
          </span>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            AI-Native Marketplace for <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-500 bg-clip-text text-transparent">
              Aerospace Mentorship
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
            Connect with verified aerospace experts, federal civil servants, and lab researchers. Guided by Gemini-powered match engines, briefing packs, and post-session synthesis.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16 justify-center sm:justify-start">
            <Link
              href="/booking"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-base transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30 active:scale-98 text-center"
            >
              Book a Session
            </Link>
            <Link
              href="/onboard"
              className="px-8 py-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white font-semibold text-base transition-all duration-200 text-center"
            >
              Apply as Mentor
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold mb-4">
              APX-01
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Smart Matching Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              BookingAgent evaluates mentee goals against aerospace disciplines to select the optimal mentor automatically.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold mb-4">
              APX-04
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Compliance Scanning</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              ComplianceAgent scans bios for federal status and performs multimodal analysis on NASA Form NF-1860.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold mb-4">
              APX-02
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI Session Briefings</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              BriefingAgent generates customized agenda summaries and resume gap reports to prepare participants.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 px-6 py-8 text-center text-xs text-slate-600">
        © 2026 AstraLink AI. Built with Google Gemini for XPrize.
      </footer>
    </div>
  );
}
