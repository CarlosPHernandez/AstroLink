import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingHeader } from '@/components/landing/landing-header';
import ExpertDirectory from '@/components/landing/expert-directory';
import { EducatorsHero } from '@/components/educators/educators-hero';
import { EducatorsCostComparison } from '@/components/educators/educators-cost-comparison';
import { EducatorsValueBento } from '@/components/educators/educators-value-bento';
import { EducatorsHowItWorks } from '@/components/educators/educators-how-it-works';
import { EducatorsDemoSection } from '@/components/educators/educators-demo-section';
import { listPublicMentors } from '@/lib/mentor-directory';
import { getProductionAppUrl } from '@/lib/app-url';

const TITLE = 'AstroLink for Educators — Book Verified Aerospace Experts';
const DESCRIPTION =
  'Give your students live 1:1 access to verified aerospace professionals — no speaker fee, no travel logistics. Book a demo for your school or program.';

export const metadata: Metadata = {
  metadataBase: new URL(getProductionAppUrl()),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getProductionAppUrl()}/for-educators` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${getProductionAppUrl()}/for-educators`,
    siteName: 'AstroLink',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const revalidate = 300;

export default async function ForEducatorsPage() {
  const experts = await listPublicMentors();

  return (
    <div className="landing-mission min-h-screen overflow-x-hidden bg-[var(--landing-surface)] text-[var(--landing-text)] font-landing-body selection:bg-[color:var(--landing-accent)]/20">
      <LandingHeader />
      <main>
        <EducatorsHero />
        <EducatorsValueBento />
        <EducatorsCostComparison />
        <ExpertDirectory
          experts={experts}
          variant="grid"
          eyebrow="Experts"
          title="People your students can talk to live."
          description="Open a profile to watch an intro, check the published rate, then book a class period or career-day session."
        />
        <EducatorsHowItWorks />
        <EducatorsDemoSection />
      </main>

      <footer className="border-t border-[color:var(--landing-border)] bg-[var(--landing-surface)] py-10 sm:py-16 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pb-16">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg flex flex-col sm:flex-row justify-between items-center gap-5 sm:gap-6">
          <Link href="/" className="font-landing-wordmark text-sm text-[var(--landing-text)]">
            AstroLink
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-[var(--landing-muted)] text-xs">
            <Link
              href="/experts"
              className="inline-flex min-h-10 touch-manipulation items-center px-2.5 hover:text-[var(--landing-text)] transition-colors sm:min-h-0"
            >
              Experts
            </Link>
            <Link
              href="/press"
              className="inline-flex min-h-10 touch-manipulation items-center px-2.5 hover:text-[var(--landing-text)] transition-colors sm:min-h-0"
            >
              Press
            </Link>
            <Link
              href="/privacy"
              className="inline-flex min-h-10 touch-manipulation items-center px-2.5 hover:text-[var(--landing-text)] transition-colors sm:min-h-0"
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
