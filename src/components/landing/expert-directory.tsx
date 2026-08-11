'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ListedExpert } from '@/lib/mentor-directory';
import { MaterialIcon } from '@/components/ui/material-icon';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';
import {
  landingFeaturedPortrait,
  orderLandingDirectoryExperts,
  orderLandingExperts,
} from '@/lib/landing/featured-expert';

const TEASER_COUNT = 6;

type ExpertDirectoryProps = {
  experts: ListedExpert[];
  variant?: 'grid' | 'mission';
  /** Optional overrides for the grid variant header */
  eyebrow?: string;
  title?: string;
  description?: string;
};

export default function ExpertDirectory({
  experts,
  variant = 'grid',
  eyebrow,
  title,
  description,
}: ExpertDirectoryProps) {
  const teaserExperts =
    variant === 'grid'
      ? orderLandingDirectoryExperts(experts)
      : orderLandingExperts(experts).slice(0, TEASER_COUNT);

  if (variant === 'mission') {
    return (
      <section id="directory" className="border-t border-[var(--landing-border)] py-12 sm:py-24 scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
          <header className="mb-6 sm:mb-10 max-w-[var(--max-width-prose)]">
            <LandingScrollReveal as="div" variant="up">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--landing-faint)]">
                Verified expert network
              </p>
              <h2 className="mt-1.5 sm:mt-2 font-landing-display text-[1.25rem] sm:text-2xl font-semibold text-[var(--landing-text)] tracking-tight leading-snug">
                Browse real people. Book a live 1:1.
              </h2>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-[var(--landing-muted)]">
                Faces and names up front. Open a profile to watch an intro, then book when
                you&apos;re ready.
              </p>
            </LandingScrollReveal>
          </header>

          {teaserExperts.length === 0 ? (
            <p className="text-sm text-[var(--landing-muted)] py-8">
              No listed experts right now. Check Supabase seed data and that mentors are approved and
              listed.
            </p>
          ) : (
            <div className="relative">
              <div className="landing-mission-scroll flex gap-3 sm:gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 snap-x snap-mandatory touch-pan-x -mx-4 px-4 sm:-mx-0 sm:px-0 sm:snap-none sm:pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {teaserExperts.map((expert, index) => {
                  const portrait = landingFeaturedPortrait(expert);
                  return (
                    <LandingScrollReveal
                      key={expert.id}
                      delay={index * 90}
                      variant="scale"
                      className="snap-start shrink-0 w-[min(62vw,200px)] sm:w-[210px] md:w-[230px]"
                    >
                      <Link
                        href={`/experts/${expert.slug}`}
                        data-testid={`expert-card-${expert.slug}`}
                        className="group block touch-manipulation overflow-hidden rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface)] shadow-[0_18px_48px_-26px_rgba(14,20,32,0.22)] transition-[border-color,box-shadow,transform] duration-300 hover:border-[color:color-mix(in_srgb,var(--landing-border)_50%,var(--landing-muted))] hover:shadow-[0_22px_52px_-22px_rgba(14,20,32,0.28)] active:scale-[0.99]"
                      >
                        <article>
                          <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--landing-surface-soft)]">
                            <Image
                              src={portrait.src}
                              alt={portrait.alt}
                              fill
                              priority={index === 0}
                              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                              sizes="(max-width: 640px) 62vw, 230px"
                            />
                            <div
                              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--landing-ink)]/55 to-transparent"
                              aria-hidden
                            />
                            <div className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 rounded-full border border-white/50 bg-white/90 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--landing-text)]">
                              Verified
                            </div>
                            <div className="absolute inset-x-2.5 bottom-2.5 sm:inset-x-3 sm:bottom-3">
                              <p className="line-clamp-1 text-[0.8125rem] sm:text-sm font-semibold leading-snug text-white drop-shadow-sm">
                                {expert.name}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-[10px] sm:text-[11px] leading-snug text-white/85">
                                {expert.role}
                              </p>
                            </div>
                          </div>
                          <div className="p-2.5 sm:p-3">
                            <p className="truncate text-xs text-[var(--landing-muted)]">
                              {expert.employer}
                            </p>
                          </div>
                        </article>
                      </Link>
                    </LandingScrollReveal>
                  );
                })}
              </div>
              <div
                className="landing-mission-scroll-fade absolute inset-y-0 right-0 w-10 sm:hidden"
                aria-hidden
              />
              <p className="mt-2 text-center text-[11px] text-[var(--landing-faint)] sm:hidden">
                Swipe for more · Tap a card for the full profile
              </p>
            </div>
          )}

          <LandingScrollReveal
            delay={120}
            variant="up"
            className="mt-7 sm:mt-8 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-5"
          >
            <Link
              href="/experts"
              data-testid="view-all-experts"
              className="inline-flex min-h-12 w-full touch-manipulation sm:min-h-0 sm:w-auto items-center justify-center gap-2 rounded-full bg-[var(--landing-accent)] px-6 py-3.5 sm:py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--landing-accent-hover)] active:scale-[0.98]"
            >
              Browse all experts
              <MaterialIcon name="arrow_forward" size={18} />
            </Link>
            <Link
              href="/auth?mode=signup&redirect=%2Fbooking"
              className="inline-flex min-h-11 touch-manipulation items-center justify-center sm:min-h-0 text-center sm:text-left text-sm text-[var(--landing-muted)] underline-offset-2 hover:text-[var(--landing-text)] hover:underline"
            >
              Create a free account to book a session
            </Link>
          </LandingScrollReveal>
        </div>
      </section>
    );
  }

  return (
    <section
      id="directory"
      className="border-t border-[var(--landing-border)] py-10 sm:py-16 lg:py-20 scroll-mt-20"
    >
      <div className="max-w-[1100px] mx-auto px-md sm:px-lg">
        <header className="mb-8 sm:mb-9">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--landing-accent)] mb-2">
            {eyebrow ?? 'Verified expert network'}
          </p>
          <h2 className="font-landing-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--landing-text)] mb-2">
            {title ?? 'Browse real people. Book a live 1:1.'}
          </h2>
          <p className="text-sm sm:text-base text-[var(--landing-muted)] max-w-[60ch]">
            {description ??
              "Faces and names up front. Open a profile to watch an intro, then book when you're ready."}
          </p>
        </header>

        {teaserExperts.length === 0 ? (
          <p className="text-sm text-[var(--landing-muted)] py-8">
            No listed experts right now. Check Supabase seed data and that mentors are approved and
            listed.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-9">
            {teaserExperts.map((expert, index) => {
              const portrait = landingFeaturedPortrait(expert);
              return (
                <Link
                  key={expert.id}
                  href={`/experts/${expert.slug}`}
                  data-testid={`expert-card-${expert.slug}`}
                  className="group overflow-hidden rounded-[14px] border border-[var(--landing-border)] bg-[var(--landing-surface)] transition-[box-shadow,border-color] duration-200 hover:shadow-[0_12px_32px_-18px_rgba(14,20,32,0.18)] hover:border-[var(--landing-muted)]"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--landing-surface-soft)]">
                    <Image
                      src={portrait.src}
                      alt={portrait.alt}
                      fill
                      priority={index === 0}
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 45vw, 220px"
                    />
                  </div>
                  <div className="p-3.5">
                    <span className="inline-block rounded-full bg-[var(--landing-accent-tint)] px-2 py-0.5 text-[9px] font-bold tracking-[0.06em] text-[var(--landing-accent)] mb-2">
                      VERIFIED
                    </span>
                    <p className="text-sm font-semibold text-[var(--landing-text)] truncate">{expert.name}</p>
                    <p className="text-xs text-[var(--landing-faint)] truncate">
                      {expert.role} · {expert.employer}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-6">
          <Link
            href="/experts"
            data-testid="view-all-experts"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--landing-ink)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
          >
            Browse all experts
            <MaterialIcon name="arrow_forward" size={18} />
          </Link>
          <Link
            href="/auth?mode=signup&redirect=%2Fbooking"
            className="text-sm text-[var(--landing-muted)] underline-offset-2 hover:text-[var(--landing-text)] hover:underline"
          >
            Create a free account to book a session
          </Link>
        </div>
      </div>
    </section>
  );
}
