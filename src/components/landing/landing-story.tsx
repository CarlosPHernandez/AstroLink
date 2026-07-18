'use client';

import Image from 'next/image';
import { useEffect, useState, type ReactNode } from 'react';
import { LandingComparisonSlider } from '@/components/landing/landing-comparison-slider';
import {
  prefersReducedMotion,
  useLandingScrollProgress,
} from '@/components/landing/landing-scroll-reveal';
import {
  findLandingFeaturedExpert,
  landingFeaturedPortrait,
} from '@/lib/landing-featured-expert';
import type { ListedExpert } from '@/lib/mentor-directory';

const GENERIC_CARD = {
  label: 'From the internet',
  body: 'Compiled from forums and search results — not accountable, not your path.',
} as const;

const EXPERT_CARD = {
  label: 'From AstroLink',
  body: 'A verified operator who has done the work — live, 1:1, on your actual question.',
} as const;

type LandingStoryProps = {
  experts: ListedExpert[];
};

function StoryHeading({
  title,
  subtitle,
  align = 'left',
}: {
  title: string;
  subtitle: string;
  align?: 'left' | 'right';
}) {
  const alignClass = align === 'right' ? 'sm:ml-auto sm:text-right' : '';

  return (
    <div className={`max-w-[30ch] ${alignClass}`}>
      <h2 className="font-landing-display text-[1.375rem] sm:text-2xl font-semibold tracking-tight text-[var(--landing-text)] leading-[1.14]">
        {title}
      </h2>
      <p className="mt-2 text-sm sm:text-[0.9375rem] text-[var(--landing-muted)] leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}

function StoryQuoteCard({
  label,
  body,
  variant,
}: {
  label: string;
  body: string;
  variant: 'generic' | 'expert';
}) {
  const isExpert = variant === 'expert';

  return (
    <div
      className={
        isExpert
          ? 'rounded-lg bg-[var(--landing-ink)] px-4 py-4 sm:px-5 sm:py-[1.125rem] shadow-[0_14px_36px_-18px_rgba(14,20,32,0.28)]'
          : 'rounded-lg bg-[var(--landing-surface)] border border-[var(--landing-border)] px-4 py-4 sm:px-5 sm:py-[1.125rem] shadow-[0_12px_32px_-20px_rgba(14,20,32,0.14)]'
      }
      data-testid={isExpert ? 'landing-story-expert-card' : 'landing-story-generic-card'}
    >
      <p
        className={`mb-2 text-xs ${
          isExpert ? 'text-[color:color-mix(in_srgb,var(--landing-border)_88%,transparent)]' : 'text-[var(--landing-faint)]'
        }`}
      >
        {label}
      </p>
      <p
        className={`text-[0.875rem] sm:text-sm leading-relaxed ${
          isExpert ? 'text-[color:color-mix(in_srgb,var(--landing-border)_95%,white)]' : 'text-[var(--landing-muted)]'
        }`}
      >
        {body}
      </p>
    </div>
  );
}

function StoryPortrait({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="landing-story-portrait-frame relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-sm border border-[var(--landing-border)] bg-[var(--landing-surface)] shadow-[0_20px_48px_-28px_rgba(14,20,32,0.22)]">
      <Image src={src} alt={alt} fill className="object-cover object-top" sizes="(max-width: 640px) 260px, 300px" />
    </div>
  );
}

function StoryStaticDesktop({
  portrait,
  genericHeadline,
  expertHeadline,
}: {
  portrait: ReactNode;
  genericHeadline: ReactNode;
  expertHeadline: ReactNode;
}) {
  return (
    <div
      className="hidden sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-10 lg:gap-14"
      data-testid="landing-story-static"
    >
      <div className="space-y-6">
        {genericHeadline}
        <StoryQuoteCard {...GENERIC_CARD} variant="generic" />
      </div>

      <div className="w-full max-w-[300px]">{portrait}</div>

      <div className="space-y-6">
        {expertHeadline}
        <StoryQuoteCard {...EXPERT_CARD} variant="expert" />
      </div>
    </div>
  );
}

function StoryScrubDesktop({
  portrait,
  genericHeadline,
  expertHeadline,
}: {
  portrait: ReactNode;
  genericHeadline: ReactNode;
  expertHeadline: ReactNode;
}) {
  return (
    <div className="landing-story-pin hidden sm:flex sm:items-center sm:justify-center" data-testid="landing-story-scrub-desktop">
      <div className="landing-story-stage relative mx-auto h-[min(76vh,680px)] w-full max-w-[1040px]">
        <div className="landing-story-generic-headline absolute left-0 top-[8%] max-w-[300px]">
          {genericHeadline}
        </div>

        <div className="landing-story-generic-card absolute left-4 lg:left-8 top-[28%] w-[min(40vw,260px)]">
          <StoryQuoteCard {...GENERIC_CARD} variant="generic" />
        </div>

        <div className="landing-story-portrait absolute left-1/2 top-[20%] w-full max-w-[min(32vw,300px)]">
          {portrait}
        </div>

        <div className="landing-story-expert-headline absolute right-0 top-[12%] max-w-[300px]">
          {expertHeadline}
        </div>

        <div className="landing-story-expert-card absolute right-4 lg:right-8 bottom-[16%] w-[min(40vw,270px)]">
          <StoryQuoteCard {...EXPERT_CARD} variant="expert" />
        </div>
      </div>
    </div>
  );
}

export function LandingStory({ experts }: LandingStoryProps) {
  const sectionRef = useLandingScrollProgress<HTMLElement>({ pinned: true });
  const [reducedMotion, setReducedMotion] = useState(false);
  const featuredExpert = findLandingFeaturedExpert(experts);
  const { src: portraitSrc, alt: portraitAlt } = landingFeaturedPortrait(featuredExpert);
  const portrait = <StoryPortrait src={portraitSrc} alt={portraitAlt} />;

  const genericHeadline = (
    <StoryHeading
      title="Generic online answers"
      subtitle="Search results and forum threads that were not written for your situation."
    />
  );

  const expertHeadline = (
    <StoryHeading
      title="Private expert access"
      subtitle="Someone who can tell you what the path actually felt like — not what an algorithm summarized."
      align="right"
    />
  );

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`landing-scroll-section landing-story-scrub border-t border-[var(--landing-border)] py-11 sm:py-0 overflow-hidden${
        reducedMotion ? ' landing-story-scrub--static sm:py-20' : ''
      }`}
      data-testid="landing-story-scrub"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-md lg:px-lg">
        <div className="sm:hidden">
          <LandingComparisonSlider
            portrait={portrait}
            beforeHeading={genericHeadline}
            afterHeading={expertHeadline}
            genericCard={<StoryQuoteCard {...GENERIC_CARD} variant="generic" />}
            expertCard={<StoryQuoteCard {...EXPERT_CARD} variant="expert" />}
          />
        </div>

        <div className="hidden sm:contents">
          {reducedMotion ? (
            <StoryStaticDesktop
              portrait={portrait}
              genericHeadline={genericHeadline}
              expertHeadline={expertHeadline}
            />
          ) : (
            <>
              <StoryScrubDesktop
                portrait={portrait}
                genericHeadline={genericHeadline}
                expertHeadline={expertHeadline}
              />
              <div className="landing-story-scroll-tail" aria-hidden data-testid="landing-story-scroll-tail" />
            </>
          )}
        </div>
      </div>
    </section>
  );
}