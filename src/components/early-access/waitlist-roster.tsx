'use client';

import Image from 'next/image';
import { ExpertIntroMedia } from '@/components/ExpertIntroMedia';
import type { ListedExpert } from '@/lib/mentor-directory';
import { WAITLIST_FEATURED_EXPERT_SLUG } from '@/lib/waitlist-roster-order';
import { toOptimizedImageUrl } from '@/lib/public-images';

type WaitlistRosterProps = {
  experts: ListedExpert[];
};

function credentialLine(expert: ListedExpert): string {
  const parts = [expert.role, expert.employer].filter(Boolean);
  return parts.join(' · ');
}

function RosterStripCard({
  expert,
  priority = false,
}: {
  expert: ListedExpert;
  priority?: boolean;
}) {
  return (
    <article>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-surface-container-low">
        <Image
          src={toOptimizedImageUrl(expert.imageUrl)}
          alt={expert.name}
          fill
          className="object-cover object-top"
          sizes="140px"
          priority={priority}
        />
      </div>
      <p className="mt-2 text-[13px] font-medium text-on-surface leading-tight line-clamp-2">
        {expert.name}
      </p>
      <p className="mt-0.5 text-xs text-on-surface-variant/70 leading-snug line-clamp-2">
        {credentialLine(expert)}
      </p>
    </article>
  );
}

function ChrisFeaturedPanel({ expert }: { expert: ListedExpert }) {
  return (
    <div data-testid="roster-featured-chris-sembroski" className="w-full min-w-0">
      <div className="relative w-[calc(100%+2*var(--spacing-md))] max-w-none -mx-md sm:w-full sm:mx-0 lg:w-full">
        <ExpertIntroMedia
          name={expert.name}
          imageUrl={expert.imageUrl}
          introVideoUrl={expert.introVideoUrl}
          priority
          overlayVariant="minimal"
          className="aspect-[4/5] sm:aspect-[3/4] w-full max-w-none rounded-none sm:rounded-sm border-0 shadow-none lg:min-h-[min(82vh,760px)] lg:aspect-auto lg:h-full lg:rounded-sm"
        />
      </div>
      <div className="mt-4 w-full min-w-0 lg:mt-4">
        <p className="text-[15px] sm:text-base font-medium text-on-surface">{expert.name}</p>
        <p className="mt-0.5 text-xs sm:text-sm text-on-surface-variant/80">Inspiration4 astronaut</p>
        <p className="mt-1 text-xs sm:text-sm text-on-surface-variant/70 leading-snug">
          {credentialLine(expert)}
        </p>
        {expert.introVideoUrl ? (
          <p className="mt-2 text-xs text-on-surface-variant/60">
            <span className="lg:hidden">Tap</span>
            <span className="hidden lg:inline">Click</span> to watch his intro
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function WaitlistRoster({ experts }: WaitlistRosterProps) {
  if (experts.length === 0) {
    return null;
  }

  const chris =
    experts.find((expert) => expert.slug === WAITLIST_FEATURED_EXPERT_SLUG) ?? null;
  const otherExperts = experts.filter((expert) => expert.slug !== WAITLIST_FEATURED_EXPERT_SLUG);

  return (
    <section
      data-testid="early-access-roster"
      aria-labelledby="roster-heading"
      className="mt-10 sm:mt-14 lg:mt-0 flex flex-col gap-10 sm:gap-12 min-w-0 lg:contents"
    >
      {chris ? (
        <aside className="w-full min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-20 lg:self-start">
          <ChrisFeaturedPanel expert={chris} />
        </aside>
      ) : null}

      <div className="contents lg:flex lg:flex-col lg:gap-8 lg:col-start-1 lg:row-start-2 lg:row-end-3 min-w-0">
        <div className="pt-2 lg:pt-0 border-t border-outline-variant/40 lg:border-0">
          <h2 id="roster-heading" className="text-sm text-on-surface-variant/70 pt-8 lg:pt-0">
            On the roster
          </h2>
          {chris ? (
            <p className="mt-1.5 text-sm sm:text-[15px] text-on-surface-variant/80 leading-relaxed max-w-[40rem]">
              Featuring{' '}
              <span className="text-on-surface font-medium">{chris.name}</span>, plus verified
              operators from across the industry.
            </p>
          ) : null}
        </div>

        {otherExperts.length > 0 ? (
          <ul className="flex gap-4 sm:gap-6 lg:gap-7 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-md px-md sm:mx-0 sm:px-0">
            {otherExperts.map((expert, index) => (
              <li
                key={expert.id}
                data-testid={`roster-expert-${expert.slug}`}
                className="snap-start shrink-0 w-[108px] sm:w-[132px] lg:w-[140px]"
              >
                <RosterStripCard expert={expert} priority={index < 3} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}