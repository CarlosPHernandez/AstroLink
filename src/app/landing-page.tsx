import LandingHero from '@/components/landing/landing-hero';
import { LandingBenefits } from '@/components/landing/landing-benefits';
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
        <LandingStory experts={experts} />
        <ExpertDirectory experts={experts} variant="mission" />
      </main>

      <footer className="border-t border-[color:var(--landing-border)] py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg flex flex-col sm:flex-row justify-between items-center gap-6">
          <span className="font-landing-wordmark text-sm text-[var(--landing-text)]">AstroLink</span>
          <div className="flex flex-wrap items-center justify-center gap-5 text-[var(--landing-muted)] text-xs">
            <Link href="/auth?mode=signup&redirect=%2Fexperts" className="hover:text-[var(--landing-text)] transition-colors">
              Experts
            </Link>
            <Link href="/press" className="hover:text-[var(--landing-text)] transition-colors">
              Press
            </Link>
            <Link href="/privacy" className="hover:text-[var(--landing-text)] transition-colors">
              Privacy
            </Link>
            <span>© 2026 AstroLink</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
