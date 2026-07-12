'use client';

import Image from 'next/image';
import { type CSSProperties } from 'react';
import { useLandingScrollProgress } from '@/components/landing/landing-scroll-reveal';
import {
  findLandingFeaturedExpert,
  landingFeaturedPortrait,
} from '@/lib/landing-featured-expert';
import type { ListedExpert } from '@/lib/mentor-directory';

type LandingStoryProps = {
  experts: ListedExpert[];
};

export function LandingStory({ experts }: LandingStoryProps) {
  const sectionRef = useLandingScrollProgress<HTMLElement>({ extended: true });
  const featuredExpert = findLandingFeaturedExpert(experts);
  const { src: portraitSrc, alt: portraitAlt } = landingFeaturedPortrait(featuredExpert);

  return (
    <section
      ref={sectionRef}
      className="landing-scroll-section py-10 sm:py-12 overflow-hidden"
      style={
        {
          '--landing-scroll-progress': '0',
          '--p-early': '0',
          '--p-mid': '0',
          '--p-late': '0',
        } as CSSProperties
      }
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-md lg:px-lg">
        <div className="flex flex-col gap-6 sm:hidden">
          <p className="text-base font-semibold text-[var(--landing-text)] leading-snug">
            Generic online answers
            <span className="block text-[var(--landing-faint)] font-normal mt-1.5 text-sm">
              Search results, forums, and advice that was not meant for you.
            </span>
          </p>

          <div className="rounded-xl bg-[var(--landing-surface)] border border-[var(--landing-border)] p-4 shadow-[0_16px_42px_-18px_rgba(14,20,32,0.18)]">
            <p className="text-[10px] uppercase text-[var(--landing-faint)] mb-2">Public internet</p>
            <p className="text-sm text-[var(--landing-muted)] leading-relaxed">
              Aerospace is competitive. Build relevant projects, network, and keep applying.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[280px] aspect-[9/16] overflow-hidden rounded-sm">
            <Image
              src={portraitSrc}
              alt={portraitAlt}
              fill
              className="object-cover object-top"
              sizes="280px"
            />
          </div>

          <p className="text-base font-semibold text-[var(--landing-text)] leading-snug">
            Private expert access
            <span className="block text-[var(--landing-faint)] font-normal mt-1.5 text-sm">
              A person who can tell you what the path actually felt like.
            </span>
          </p>

          <div className="rounded-xl bg-[var(--landing-ink)] p-4 shadow-[0_16px_42px_-16px_rgba(14,20,32,0.3)]">
            <p className="text-[10px] uppercase text-[var(--landing-faint)] mb-2">AstroLink expert</p>
            <p className="text-sm text-[var(--landing-border)] leading-relaxed">
              Bring your goal, class project, or career question and talk it through live.
            </p>
          </div>
        </div>

        <div className="relative hidden sm:block min-h-[115vh]">
          <p className="landing-scroll-float-left absolute left-0 top-[10%] max-w-[280px] text-lg font-semibold text-[var(--landing-text)] leading-snug">
            Generic online answers
            <span className="block text-[var(--landing-faint)] font-normal mt-2 text-base">
              Search results, forums, and advice that was not meant for you.
            </span>
          </p>

          <div className="landing-scroll-card-left absolute left-12 top-[24%] w-[250px] rounded-xl bg-[var(--landing-surface)] border border-[var(--landing-border)] p-5 shadow-[0_20px_54px_-18px_rgba(14,20,32,0.2)]">
            <p className="text-[10px] uppercase text-[var(--landing-faint)] mb-2">Public internet</p>
            <p className="text-sm text-[var(--landing-muted)] leading-relaxed">
              Aerospace is competitive. Build relevant projects, network, and keep applying.
            </p>
          </div>

          <div className="landing-scroll-portrait absolute left-1/2 top-[22%] w-full max-w-[360px] aspect-[9/16] overflow-hidden rounded-sm">
            <Image
              src={portraitSrc}
              alt={portraitAlt}
              fill
              className="object-cover object-top"
              sizes="360px"
            />
          </div>

          <p className="landing-scroll-float-right absolute right-0 top-[16%] max-w-[300px] text-right text-lg font-semibold text-[var(--landing-text)] leading-snug">
            Private expert access
            <span className="block text-[var(--landing-faint)] font-normal mt-2 text-base">
              A person who can tell you what the path actually felt like.
            </span>
          </p>

          <div className="landing-scroll-card-right absolute right-10 bottom-[14%] w-[270px] rounded-xl bg-[var(--landing-ink)] p-5 shadow-[0_20px_54px_-16px_rgba(14,20,32,0.36)]">
            <p className="text-[10px] uppercase text-[var(--landing-faint)] mb-2">AstroLink expert</p>
            <p className="text-sm text-[var(--landing-border)] leading-relaxed">
              Bring your goal, class project, or career question and talk it through live.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
