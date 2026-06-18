'use client';

import Link from 'next/link';
import type { ListedExpert } from '@/lib/mentor-directory';
import { WaitlistHeader } from '@/components/early-access/waitlist-header';
import { WaitlistHero } from '@/components/early-access/waitlist-hero';
import { WaitlistRoster } from '@/components/early-access/waitlist-roster';
import { WaitlistSignupForm } from '@/components/early-access/waitlist-signup-form';

type EarlyAccessClientProps = {
  copyrightYear: number;
  showExpertsLink: boolean;
  experts: ListedExpert[];
};

export default function EarlyAccessClient({
  copyrightYear,
  showExpertsLink,
  experts,
}: EarlyAccessClientProps) {
  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-zinc-900 selection:text-white">
      <WaitlistHeader showExpertsLink={showExpertsLink} />

      <main className="max-w-[var(--spacing-container-max)] mx-auto px-md sm:px-lg">
        <div className="pt-8 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,46%)] lg:gap-x-10 xl:gap-x-14 lg:items-start">
          <div className="min-w-0 space-y-5 sm:space-y-7 lg:col-start-1 lg:row-start-1">
            <WaitlistHero />
            <WaitlistSignupForm />
          </div>

          {experts.length > 0 ? <WaitlistRoster experts={experts} /> : null}
        </div>
      </main>

      <footer className="pb-8">
        <div className="max-w-[var(--spacing-container-max)] mx-auto px-md sm:px-lg flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-on-surface-variant/70">
          <span>© {copyrightYear} AstroLink</span>
          <Link href="/privacy" className="hover:text-on-surface transition-colors">
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}