'use client';

import Image from 'next/image';
import { type CSSProperties } from 'react';
import { useLandingScrollProgress } from '@/components/landing/landing-scroll-reveal';

export function LandingStory() {
  const sectionRef = useLandingScrollProgress<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="landing-scroll-section py-16 sm:py-24 overflow-hidden"
      style={{ '--landing-scroll-progress': '0' } as CSSProperties}
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <div className="relative min-h-[420px] sm:min-h-[520px]">
          <p className="landing-scroll-float-left absolute left-0 top-8 sm:top-16 max-w-[220px] sm:max-w-[260px] text-sm sm:text-base font-semibold text-neutral-900 leading-snug">
            Generic AI reference
            <span className="block text-neutral-400 font-normal mt-1">
              Textbook answers. No operational liability.
            </span>
          </p>

          <div className="landing-scroll-card-left absolute left-4 sm:left-16 top-32 sm:top-40 w-[min(46vw,200px)] sm:w-[220px] rounded-xl bg-white border border-neutral-200/80 p-4 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)]">
            <p className="text-[10px] uppercase text-neutral-400 mb-2">AI assistant</p>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Apply standard thermal models. Verify with vendor documentation.
            </p>
          </div>

          <div className="landing-scroll-portrait relative mx-auto w-full max-w-[280px] sm:max-w-[320px] aspect-[9/16] mt-24 sm:mt-8 overflow-hidden rounded-sm">
            <Image
              src="/chris_sembroski.webp"
              alt="Live mentor session"
              fill
              className="object-cover object-top"
              sizes="320px"
            />
          </div>

          <p className="landing-scroll-float-right absolute right-0 top-20 sm:top-28 max-w-[220px] sm:max-w-[280px] text-right text-sm sm:text-base font-semibold text-neutral-900 leading-snug">
            Live mentor session
            <span className="block text-neutral-400 font-normal mt-1">
              Real flight experience. Accountable guidance.
            </span>
          </p>

          <div className="landing-scroll-card-right absolute right-4 sm:right-12 bottom-8 sm:bottom-16 w-[min(50vw,220px)] sm:w-[240px] rounded-xl bg-neutral-900 p-4 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.2)]">
            <p className="text-[10px] uppercase text-neutral-500 mb-2">AstroLink mentor</p>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Walk your timeline against what we actually saw in flight — not what a model guessed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}