import LandingHero from '@/components/landing/landing-hero';
import { LandingBenefits } from '@/components/landing/landing-benefits';
import { LandingTrust } from '@/components/landing/landing-trust';
import { LandingStory } from '@/components/landing/landing-story';
import ExpertDirectory from '@/components/landing/expert-directory';
import { LandingHeader } from '@/components/landing/landing-header';
import Link from 'next/link';
import type { ListedExpert } from '@/lib/mentor-directory';

export default function LandingPage({ experts }: { experts: ListedExpert[] }) {
  return (
    <div className="landing-mission min-h-screen overflow-x-hidden bg-[var(--landing-canvas)] text-[var(--landing-text)] font-landing-body selection:bg-[color:var(--landing-accent)]/20">
      <LandingHeader />
      <main>
        <LandingHero experts={experts} />
        <LandingBenefits />
        <LandingTrust />
        <LandingStory experts={experts} />
        <ExpertDirectory experts={experts} variant="mission" />
      </main>

      <footer className="border-t border-[color:var(--landing-border)] py-10 sm:py-16 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pb-16">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg flex flex-col sm:flex-row justify-between items-center gap-5 sm:gap-6">
          <span className="font-landing-wordmark text-sm text-[var(--landing-text)]">AstroLink</span>
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
