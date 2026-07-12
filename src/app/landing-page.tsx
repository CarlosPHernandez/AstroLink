import LandingHero from '@/components/landing/landing-hero';
import { LandingBenefits } from '@/components/landing/landing-benefits';
import { LandingStory } from '@/components/landing/landing-story';
import ExpertDirectory from '@/components/landing/expert-directory';
import { LandingHeader } from '@/components/landing/landing-header';
import type { ListedExpert } from '@/lib/mentor-directory';

export default function LandingPage({ experts }: { experts: ListedExpert[] }) {
  return (
    <div className="landing-mission min-h-screen overflow-x-hidden bg-[#f7f6f2] text-neutral-900 font-landing-body selection:bg-[#1a5fd1]/20">
      <LandingHeader />
      <main>
        <LandingHero experts={experts} />
        <LandingBenefits />
        <LandingStory />
        <ExpertDirectory experts={experts} variant="mission" />
      </main>

      <footer className="border-t border-neutral-200/60 py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg flex flex-col sm:flex-row justify-between items-center gap-6">
          <span className="font-landing-wordmark text-sm text-neutral-900">AstroLink</span>
          <div className="flex flex-wrap items-center justify-center gap-5 text-neutral-500 text-xs">
            <a href="/experts" className="hover:text-neutral-900 transition-colors">
              Experts
            </a>
            <a href="/press" className="hover:text-neutral-900 transition-colors">
              Press
            </a>
            <a href="/privacy" className="hover:text-neutral-900 transition-colors">
              Privacy
            </a>
            <span>© 2026 AstroLink</span>
          </div>
        </div>
      </footer>
    </div>
  );
}