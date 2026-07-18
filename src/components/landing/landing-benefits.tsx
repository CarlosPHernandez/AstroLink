'use client';

import Link from 'next/link';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

const BENEFITS = [
  { line1: 'Astronauts and operators', line2: 'within reach' },
  { line1: 'Career paths and projects', line2: 'from people who know' },
  { line1: 'Browse freely', line2: 'book a live 1:1 when ready' },
] as const;

export function LandingBenefits() {
  return (
    <section
      id="pipeline"
      className="scroll-mt-20 border-t border-[var(--landing-border)] py-11 sm:py-24 lg:py-28"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 md:gap-8 lg:gap-12 text-center md:text-left items-start md:items-center">
          {BENEFITS.map((benefit, index) => (
            <LandingScrollReveal
              key={benefit.line1}
              as="h2"
              delay={index * 90}
              variant="up"
              className="m-0"
            >
              <span className="font-landing-display text-[1.35rem] sm:text-[1.875rem] lg:text-[2.125rem] font-semibold tracking-tight text-[var(--landing-text)] leading-[1.14] block">
                {benefit.line1}
                <br />
                <span className="text-[var(--landing-muted)] font-medium">{benefit.line2}</span>
              </span>
            </LandingScrollReveal>
          ))}
        </div>

        <LandingScrollReveal
          as="p"
          delay={120}
          variant="up"
          className="mt-10 sm:mt-20 text-center text-sm sm:text-base text-[var(--landing-muted)] max-w-[var(--max-width-prose)] mx-auto leading-relaxed"
        >
          AstroLink is for students, career-switchers, teams, and curious people who want real
          conversations with people who have worked, flown, built, and trained in space.
        </LandingScrollReveal>

        <LandingScrollReveal
          delay={180}
          variant="up"
          className="mt-7 sm:mt-10 flex justify-center text-sm text-[var(--landing-faint)]"
        >
          <Link
            href="/experts"
            className="inline-flex min-h-11 touch-manipulation items-center px-2 text-[var(--landing-muted)] underline-offset-2 hover:text-[var(--landing-text)] hover:underline sm:min-h-0"
          >
            Browse the full expert directory
          </Link>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
