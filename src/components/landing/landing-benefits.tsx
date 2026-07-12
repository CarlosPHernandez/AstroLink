'use client';

import Link from 'next/link';
import { type CSSProperties } from 'react';
import { useLandingScrollProgress } from '@/components/landing/landing-scroll-reveal';

const BENEFITS = [
  { line1: 'Astronauts and operators', line2: 'within reach' },
  { line1: 'Career paths and projects', line2: 'from people who know' },
  { line1: 'Free account access', line2: 'before you book' },
] as const;

export function LandingBenefits() {
  const sectionRef = useLandingScrollProgress<HTMLElement>({ extended: true });

  return (
    <section
      ref={sectionRef}
      id="pipeline"
      className="landing-benefits-section scroll-mt-20 py-16 sm:py-36 border-t border-[var(--landing-border)]"
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
              <span className="font-landing-display text-[1.625rem] sm:text-[2rem] lg:text-4xl font-semibold tracking-tight text-[var(--landing-text)] leading-[1.12] block">
                {benefit.line1}
                <br />
                <span className="text-[var(--landing-faint)]">{benefit.line2}</span>
              </span>
            </h2>
          ))}
        </div>

        <p className="landing-benefits-copy mt-20 sm:mt-28 text-center text-sm sm:text-base text-[var(--landing-muted)] max-w-[var(--max-width-prose)] mx-auto leading-relaxed">
          AstroLink is for students, career-switchers, teams, and curious people who want real
          conversations with people who have worked, flown, built, and trained in space.
        </p>

        <div className="landing-benefits-cta mt-12 flex justify-center">
          <Link
            href="/auth?mode=signup&redirect=%2Fexperts"
            className="inline-flex items-center justify-center rounded-full bg-[var(--landing-accent)] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[var(--landing-accent-hover)] transition-colors"
          >
            Unlock access
          </Link>
        </div>
      </div>
    </section>
  );
}
