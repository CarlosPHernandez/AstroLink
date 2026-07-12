'use client';

import Link from 'next/link';
import { type CSSProperties } from 'react';
import { useLandingScrollProgress } from '@/components/landing/landing-scroll-reveal';

const BENEFITS = [
  { line1: 'Verified experts', line2: 'with mission pedigree' },
  { line1: 'Live 1:1 video', line2: 'not chatbot autocomplete' },
  { line1: 'Clear pricing', line2: 'before you book' },
] as const;

export function LandingBenefits() {
  const sectionRef = useLandingScrollProgress<HTMLElement>({ extended: true });

  return (
    <section
      ref={sectionRef}
      id="pipeline"
      className="landing-benefits-section scroll-mt-20 py-16 sm:py-36 border-t border-neutral-200/60"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-14 md:gap-10 text-center md:text-left min-h-0 sm:min-h-[55vh] items-center">
          {BENEFITS.map((benefit, index) => (
            <h2
              key={benefit.line1}
              className={`landing-benefit-item landing-benefit-item-${index + 1}`}
            >
              <span className="font-landing-display text-[1.625rem] sm:text-[2rem] lg:text-4xl font-semibold tracking-tight text-neutral-900 leading-[1.12] block">
                {benefit.line1}
                <br />
                <span className="text-neutral-400">{benefit.line2}</span>
              </span>
            </h2>
          ))}
        </div>

        <p className="landing-benefits-copy mt-20 sm:mt-28 text-center text-sm sm:text-base text-neutral-500 max-w-[var(--max-width-prose)] mx-auto leading-relaxed">
          AI pulls from manuals and forums. AstroLink mentors answer from flight logs, launch
          authority, and years on console — then stand behind the recommendation on a live call.
        </p>

        <div className="landing-benefits-cta mt-12 flex justify-center">
          <Link
            href="/auth"
            className="inline-flex items-center justify-center rounded-full bg-[#1a5fd1] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#164fb3] transition-colors"
          >
            Book a session
          </Link>
        </div>
      </div>
    </section>
  );
}