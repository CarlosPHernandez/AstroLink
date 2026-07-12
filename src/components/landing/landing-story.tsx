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
      className="landing-scroll-section py-8 sm:py-12 overflow-hidden"
      style={
        {
          '--landing-scroll-progress': '0',
          '--p-early': '0',
          '--p-mid': '0',
          '--p-late': '0',
        } as CSSProperties
      }
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <div className="relative min-h-[110vh] sm:min-h-[115vh]">
          <p className="landing-scroll-float-left absolute left-0 top-[8%] sm:top-[10%] max-w-[220px] sm:max-w-[280px] text-sm sm:text-lg font-semibold text-neutral-900 leading-snug">
            Generic AI reference
            <span className="block text-neutral-400 font-normal mt-2 text-sm sm:text-base">
              Textbook answers. No operational liability.
            </span>
          </p>

          <div className="landing-scroll-card-left absolute left-2 sm:left-12 top-[22%] sm:top-[24%] w-[min(52vw,220px)] sm:w-[250px] rounded-xl bg-white border border-neutral-200/80 p-4 sm:p-5 shadow-[0_20px_50px_-14px_rgba(0,0,0,0.15)]">
            <p className="text-[10px] uppercase text-neutral-400 mb-2">AI assistant</p>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Apply standard thermal models. Verify with vendor documentation.
            </p>
          </div>

          <div className="landing-scroll-portrait absolute left-1/2 top-[30%] sm:top-[22%] w-full max-w-[300px] sm:max-w-[360px] aspect-[9/16] overflow-hidden rounded-sm">
            <Image
              src={portraitSrc}
              alt={portraitAlt}
              fill
              className="object-cover object-top"
              sizes="360px"
            />
          </div>

          <p className="landing-scroll-float-right absolute right-0 top-[14%] sm:top-[16%] max-w-[220px] sm:max-w-[300px] text-right text-sm sm:text-lg font-semibold text-neutral-900 leading-snug">
            Live mentor session
            <span className="block text-neutral-400 font-normal mt-2 text-sm sm:text-base">
              Real flight experience. Accountable guidance.
            </span>
          </p>

          <div className="landing-scroll-card-right absolute right-2 sm:right-10 bottom-[12%] sm:bottom-[14%] w-[min(54vw,240px)] sm:w-[270px] rounded-xl bg-neutral-900 p-4 sm:p-5 shadow-[0_20px_50px_-14px_rgba(0,0,0,0.28)]">
            <p className="text-[10px] uppercase text-neutral-500 mb-2">AstroLink mentor</p>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Walk your timeline against what we actually saw in flight — not what a model guessed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}