'use client';

import Link from 'next/link';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

const BENEFITS = [
  { line1: 'Astronauts and operators', line2: 'within reach' },
  { line1: 'Career paths and projects', line2: 'from people who know' },
  { line1: 'Free account access', line2: 'before you book' },
] as const;

export function LandingBenefits() {
  return (
    <section
      id="pipeline"
      className="scroll-mt-20 border-t border-[var(--landing-border)] py-16 sm:py-36"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-14 md:gap-10 text-center md:text-left min-h-0 sm:min-h-[55vh] items-center">
          {BENEFITS.map((benefit, index) => (
            <LandingScrollReveal
              key={benefit.line1}
              as="h2"
              delay={index * 90}
              variant="up"
              className="m-0"
            >
              <span className="font-landing-display text-[1.625rem] sm:text-[2rem] lg:text-4xl font-semibold tracking-tight text-[var(--landing-text)] leading-[1.12] block">
                {benefit.line1}
                <br />
                <span className="text-[var(--landing-faint)]">{benefit.line2}</span>
              </span>
            </LandingScrollReveal>
          ))}
        </div>

        <LandingScrollReveal as="p" delay={120} variant="up" className="mt-20 sm:mt-28 text-center text-sm sm:text-base text-[var(--landing-muted)] max-w-[var(--max-width-prose)] mx-auto leading-relaxed">
          AstroLink is for students, career-switchers, teams, and curious people who want real
          conversations with people who have worked, flown, built, and trained in space.
        </LandingScrollReveal>

        <LandingScrollReveal delay={180} variant="up" className="mt-10 flex justify-center text-sm text-[var(--landing-faint)]">
          <Link
            href="/auth?mode=signup&redirect=%2Fexperts"
            className="text-[var(--landing-muted)] underline-offset-2 hover:text-[var(--landing-text)] hover:underline"
          >
            Create a free account to browse experts
          </Link>
        </LandingScrollReveal>
      </div>
    </section>
  );
}