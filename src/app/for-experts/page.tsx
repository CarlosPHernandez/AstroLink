import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingHeader } from '@/components/landing/landing-header';
import { ApplyForm } from '@/components/for-experts/apply-form';
import { getProductionAppUrl } from '@/lib/app-url';

const TITLE = 'Become an AstroLink expert';
const DESCRIPTION =
  'Apply to offer live 1:1 sessions with operators and specialists. AstroLink reviews every application before an expert appears in the directory.';

export const metadata: Metadata = {
  metadataBase: new URL(getProductionAppUrl()),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getProductionAppUrl()}/for-experts` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${getProductionAppUrl()}/for-experts`,
    siteName: 'AstroLink',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function ForExpertsPage() {
  return (
    <div className="landing-mission min-h-screen overflow-x-hidden bg-[var(--landing-surface)] text-[var(--landing-text)] font-landing-body selection:bg-[color:var(--landing-accent)]/20">
      <LandingHeader />
      <main className="mx-auto w-full max-w-[40rem] px-md pb-16 pt-8 sm:px-lg sm:pt-12">
        <h1 className="font-landing-display text-[1.85rem] font-extrabold leading-[1.1] tracking-tight text-balance text-[var(--landing-text)] sm:text-[2.4rem]">
          Teach what you have already done.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--landing-muted)]">
          Set your hourly rate, the hours you can take calls, and the services you offer. We review
          the application, then send a private invite to finish your profile.
        </p>
        <div className="mt-8">
          <ApplyForm />
        </div>
      </main>

      <footer className="border-t border-[color:var(--landing-border)] bg-[var(--landing-surface)] py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:py-16 sm:pb-16">
        <div className="mx-auto flex w-full max-w-[40rem] flex-col items-center justify-between gap-5 px-md sm:flex-row sm:px-lg">
          <Link href="/" className="font-landing-wordmark text-sm text-[var(--landing-text)]">
            AstroLink
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-xs text-[var(--landing-muted)]">
            <Link
              href="/experts"
              className="inline-flex min-h-10 touch-manipulation items-center px-2.5 transition-colors hover:text-[var(--landing-text)] sm:min-h-0"
            >
              Experts
            </Link>
            <Link
              href="/press"
              className="inline-flex min-h-10 touch-manipulation items-center px-2.5 transition-colors hover:text-[var(--landing-text)] sm:min-h-0"
            >
              Press
            </Link>
            <Link
              href="/privacy"
              className="inline-flex min-h-10 touch-manipulation items-center px-2.5 transition-colors hover:text-[var(--landing-text)] sm:min-h-0"
            >
              Privacy
            </Link>
            <span className="px-2.5 py-2 sm:py-0">© 2026 AstroLink</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
