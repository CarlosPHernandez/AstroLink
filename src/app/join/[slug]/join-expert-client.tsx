'use client';

import Link from 'next/link';
import { ExpertIntroMedia } from '@/components/ExpertIntroMedia';
import { JoinExpertHero } from '@/components/early-access/join-expert-hero';
import { WaitlistHeader } from '@/components/early-access/waitlist-header';
import { WaitlistSignupForm } from '@/components/early-access/waitlist-signup-form';
import type { ListedExpert } from '@/lib/mentor-directory';
import { trackWaitlistIntroPlay } from '@/lib/waitlist/waitlist-analytics';
import { useWaitlistPageAnalytics } from '@/lib/waitlist/use-waitlist-page-analytics';

type JoinExpertClientProps = {
  expert: ListedExpert;
  copyrightYear: number;
  defaultReferrer: string;
};

function credentialLine(expert: ListedExpert): string {
  const parts = [expert.role, expert.employer].filter(Boolean);
  return parts.join(' · ');
}

function JoinExpertFeaturedPanel({ expert }: { expert: ListedExpert }) {
  const credentials = credentialLine(expert);

  return (
    <aside
      data-testid="join-expert-featured"
      className="w-full min-w-0 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-20 lg:self-start"
    >
      <div className="relative w-[calc(100%+2*var(--spacing-md))] max-w-none -mx-md sm:w-full sm:mx-0 lg:w-full">
        <ExpertIntroMedia
          name={expert.name}
          imageUrl={expert.imageUrl}
          introVideoUrl={expert.introVideoUrl}
          priority
          overlayVariant="minimal"
          onUserPlay={() => trackWaitlistIntroPlay(expert.slug)}
          className="aspect-[4/5] sm:aspect-[3/4] w-full max-w-none rounded-none sm:rounded-sm border-0 shadow-none lg:min-h-[min(82vh,760px)] lg:aspect-auto lg:h-full lg:rounded-sm"
        />
      </div>
      <div className="mt-4 w-full min-w-0">
        <p className="text-[15px] sm:text-base font-medium text-on-surface">{expert.name}</p>
        {credentials ? (
          <p className="mt-0.5 text-xs sm:text-sm text-on-surface-variant/80 leading-snug">
            {credentials}
          </p>
        ) : null}
        {expert.introVideoUrl ? (
          <p className="mt-2 text-xs text-on-surface-variant/60">
            <span className="lg:hidden">Tap</span>
            <span className="hidden lg:inline">Click</span> to watch the intro
          </p>
        ) : null}
      </div>
    </aside>
  );
}

export default function JoinExpertClient({
  expert,
  copyrightYear,
  defaultReferrer,
}: JoinExpertClientProps) {
  const analytics = useWaitlistPageAnalytics({
    page: 'join',
    expert: expert.slug,
    defaultReferrer,
  });

  return (
    <div
      data-testid="join-expert-page"
      className="min-h-screen bg-background text-on-surface font-sans selection:bg-zinc-900 selection:text-white"
    >
      <WaitlistHeader
        showExpertsLink={false}
        secondaryLink={{ href: '/early-access', label: 'All experts' }}
      />

      <main className="max-w-[var(--spacing-container-max)] mx-auto px-md sm:px-lg">
        <div className="pt-8 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,46%)] lg:gap-x-10 xl:gap-x-14 lg:items-start">
          <div className="min-w-0 space-y-5 sm:space-y-7 lg:col-start-1 lg:row-start-1">
            <JoinExpertHero expert={expert} />
            <WaitlistSignupForm defaultReferrer={defaultReferrer} analytics={analytics} />
          </div>

          <JoinExpertFeaturedPanel expert={expert} />
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