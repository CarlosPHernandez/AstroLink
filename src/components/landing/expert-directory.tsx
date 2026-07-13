'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ListedExpert } from '@/lib/mentor-directory';
import { MaterialIcon } from '@/components/ui/material-icon';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';
import { landingFeaturedPortrait, orderLandingExperts } from '@/lib/landing-featured-expert';
import { toOptimizedImageUrl } from '@/lib/public-images';

const TEASER_COUNT = 6;

type ExpertDirectoryProps = {
  experts: ListedExpert[];
  variant?: 'default' | 'mission';
};

export default function ExpertDirectory({ experts, variant = 'default' }: ExpertDirectoryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredExperts =
    selectedCategory === 'all'
      ? experts
      : experts.filter((e) => e.category === selectedCategory);

  const teaserExperts = orderLandingExperts(filteredExperts).slice(0, TEASER_COUNT);

  if (variant === 'mission') {
    return (
      <section id="directory" className="border-t border-[var(--landing-border)] py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
          <header className="mb-8 sm:mb-10 max-w-[var(--max-width-prose)]">
            <LandingScrollReveal as="div" variant="up">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--landing-faint)]">
                Private expert network
              </p>
              <h2 className="mt-2 font-landing-display text-xl sm:text-2xl font-semibold text-[var(--landing-text)] tracking-tight">
                Proof of access before the full roster.
              </h2>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-[var(--landing-muted)]">
                Create a free account to see available astronauts, engineers, operators, and career
                mentors. Public visitors see a preview, not the full directory.
              </p>
            </LandingScrollReveal>
          </header>

          {teaserExperts.length === 0 ? (
            <p className="text-sm text-[var(--landing-muted)] py-8">
              No listed experts right now. Check Supabase seed data and that mentors are approved and
              listed.
            </p>
          ) : (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 snap-x snap-mandatory landing-mission-scroll -mx-4 px-4 sm:-mx-0 sm:px-0">
              {teaserExperts.map((expert, index) => {
                const portrait = landingFeaturedPortrait(expert);
                return (
                  <LandingScrollReveal
                    key={expert.id}
                    delay={index * 90}
                    variant="scale"
                    className="snap-start shrink-0 w-[min(58vw,210px)] sm:w-[210px] md:w-[230px]"
                  >
                    <article
                      className="overflow-hidden rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface)] shadow-[0_18px_48px_-26px_rgba(14,20,32,0.22)]"
                      data-testid={`locked-expert-card-${index}`}
                    >
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--landing-surface-soft)]">
                      <Image
                        src={portrait.src}
                        alt=""
                        fill
                        priority={index === 0}
                        className="object-cover blur-[3px] scale-[1.02] saturate-[0.86]"
                        sizes="220px"
                      />
                      <div className="absolute inset-0 bg-[var(--landing-ink)]/12" aria-hidden />
                      <div className="absolute left-3 top-3 rounded-full border border-white/40 bg-white/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--landing-text)] backdrop-blur">
                        Verified
                      </div>
                      <div className="absolute inset-x-3 bottom-3 rounded-md bg-[var(--landing-surface)]/88 p-3 backdrop-blur">
                        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--landing-faint)]">
                          Unlock to view
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-[var(--landing-text)]">
                          {expert.role}
                        </p>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="truncate text-xs text-[var(--landing-muted)]">
                        {expert.employer}
                      </p>
                    </div>
                  </article>
                  </LandingScrollReveal>
                );
              })}
            </div>
          )}

          <LandingScrollReveal delay={120} variant="up" className="mt-8">
            <Link
              href="/auth?mode=signup&redirect=%2Fexperts"
              data-testid="unlock-private-network"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-[var(--landing-accent)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--landing-accent-hover)]"
            >
              Create free account to view experts
            </Link>
          </LandingScrollReveal>
        </div>
      </section>
    );
  }

  return (
    <section
      id="directory"
      className="border-t border-outline-variant/30 bg-surface-container-low py-20 px-0 md:px-6 scroll-mt-20"
    >
      <div className="max-w-[1200px] mx-auto px-lg">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-on-surface uppercase">
              Verified Directories
            </h2>
            <p className="text-on-surface-variant text-xs mt-1">
              Featured experts — browse the full directory to watch intros and book sessions.
            </p>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter featured experts by category"
          >
            {['all', 'systems', 'propulsion', 'spacecraft', 'policy'].map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className={`touch-manipulation px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border rounded-md transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary text-white border-primary'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {teaserExperts.length === 0 ? (
          <p className="text-sm text-on-surface-variant font-light px-2 py-8">
            No listed experts right now. Check Supabase seed data and that mentors are approved and
            listed.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {teaserExperts.map((expert, index) => (
              <Link
                key={expert.id}
                href={`/experts/${expert.slug}`}
                data-testid={`expert-card-${expert.slug}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest hover:border-outline hover:shadow-md transition-all duration-300"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-container-low">
                  <Image
                    src={toOptimizedImageUrl(expert.imageUrl)}
                    alt={expert.name}
                    fill
                    priority={index === 0}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 45vw, 220px"
                  />
                </div>
                <div className="p-4 border-t border-outline-variant/50">
                  <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                    {expert.name}
                  </p>
                  <p className="text-label-sm text-on-surface-variant truncate mt-0.5 tabular-nums">
                    ${expert.rate}/hr
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            href="/experts"
            data-testid="view-all-experts"
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface hover:border-primary hover:text-primary transition-colors"
          >
            View all experts
            <MaterialIcon name="arrow_forward" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
