import Link from 'next/link';
import type { Metadata } from 'next';
import { AssessmentForm } from '@/components/path-assessment/assessment-form';

export const metadata: Metadata = {
  title: 'Free Space Path Assessment | AstroLink',
  description:
    'Get a free personalized aerospace readiness report in 2–3 minutes. No account required.',
};

export default function AssessmentPage() {
  return (
    <div className="landing-mission min-h-screen bg-[var(--landing-canvas)] text-[var(--landing-text)] font-landing-body">
      <header className="border-b border-[var(--landing-border)] bg-[var(--landing-surface)]">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-landing-wordmark text-sm font-semibold text-[var(--landing-text)]"
          >
            AstroLink
          </Link>
          <Link
            href="/experts"
            className="text-sm text-[var(--landing-muted)] hover:text-[var(--landing-text)]"
          >
            Experts
          </Link>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-md sm:px-lg py-6 sm:py-10 lg:py-12 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-6">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--landing-faint)]">
              Free · 2–3 minutes · no account
            </p>
            <h1 className="mt-2 font-landing-display text-2xl sm:text-[1.75rem] lg:text-3xl font-semibold tracking-tight text-[var(--landing-text)]">
              Space Path Assessment
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[var(--landing-muted)] leading-relaxed">
              Find out where you stand — and what to do next. Personalized report on this page and
              in your inbox.
            </p>
          </div>
          <ul className="hidden sm:flex shrink-0 flex-col gap-1.5 text-xs text-[var(--landing-muted)]">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" aria-hidden />
              Personalized gaps + next actions
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" aria-hidden />
              Powered by Gemini
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" aria-hidden />
              Optional live expert review after
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-5 sm:p-8 lg:p-10 shadow-[0_12px_40px_-28px_rgba(14,20,32,0.2)]">
          <AssessmentForm />
        </div>
      </main>
    </div>
  );
}
