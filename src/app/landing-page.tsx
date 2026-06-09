import dynamic from 'next/dynamic';
import { LandingAuthNavClient } from '@/components/landing/landing-auth-nav-client';
import { LandingComparison } from '@/components/landing/landing-comparison';
import type { ListedExpert } from '@/lib/mentor-directory';

const LandingHero = dynamic(() => import('@/components/landing/landing-hero'));
const ExpertDirectory = dynamic(() => import('@/components/landing/expert-directory'));

export default function LandingPage({ experts }: { experts: ListedExpert[] }) {
  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-zinc-800 selection:text-white overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-outline-variant">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg h-20 flex justify-between items-center w-full">
          <span className="font-bold text-lg text-on-surface tracking-tight">Astrolink</span>
          <LandingAuthNavClient />
        </div>
      </header>

      <main>
        <section className="max-w-[1200px] mx-auto px-md py-8 sm:px-lg sm:py-12 lg:py-14 mt-4 mb-12 sm:mb-20 relative">
          <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-primary-container/5 via-secondary-container/5 to-tertiary-container/5 blur-[130px] rounded-full -z-10 pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-gradient-to-br from-secondary-container/5 to-tertiary-container/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
          <div className="flex flex-col gap-sm mb-8 sm:mb-12 text-center items-center">
            <h1 className="font-display text-[40px] xs:text-[48px] sm:text-[56px] md:text-[64px] lg:text-[72px] leading-[1.08] font-bold text-on-surface max-w-3xl tracking-tighter">
              Book verified space experts
            </h1>
            <p className="font-body-lg text-base sm:text-lg md:text-xl text-on-surface-variant max-w-3xl leading-snug tracking-tight font-light px-2">
              Live 1:1 calls, custom video replies, or paid text—with astronauts, flight controllers, and operators. Clear pricing before you book.
            </p>
          </div>
          <LandingHero />
        </section>

        <ExpertDirectory experts={experts} />
        <LandingComparison />
      </main>

      <footer className="border-t border-outline-variant bg-white">
        <div className="max-w-[1200px] mx-auto py-12 px-lg flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="font-bold text-on-surface tracking-tight">AstroLink</div>
          <div className="flex gap-lg items-center">
            <span className="text-[10px] font-mono text-on-surface-variant flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Operational Downlink
            </span>
          </div>
          <div className="text-on-surface-variant font-mono text-[10px]">
            © 2026 AstroLink. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
