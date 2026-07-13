'use client';

import Image from 'next/image';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
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
  label: 'Public internet',
  body: 'Aerospace is competitive. Build relevant projects, network, and keep applying.',
} as const;

const EXPERT_CARD = {
  label: 'AstroLink expert',
  body: 'Bring your goal, class project, or career question and talk it through live.',
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
  return (
    <p
      className={`text-base font-semibold text-[var(--landing-text)] leading-snug ${
        align === 'right' ? 'text-right' : ''
      }`}
    >
      {title}
      <span
        className={`block text-[var(--landing-faint)] font-normal mt-1.5 text-sm ${
          align === 'right' ? 'sm:text-base' : ''
        }`}
      >
        {subtitle}
      </span>
    </p>
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
          ? 'rounded-xl bg-[var(--landing-ink)] p-4 sm:p-5 shadow-[0_16px_42px_-16px_rgba(14,20,32,0.3)]'
          : 'rounded-xl bg-[var(--landing-surface)] border border-[var(--landing-border)] p-4 sm:p-5 shadow-[0_16px_42px_-18px_rgba(14,20,32,0.18)]'
      }
      data-testid={isExpert ? 'landing-story-expert-card' : 'landing-story-generic-card'}
    >
      <p className="text-[10px] uppercase text-[var(--landing-faint)] mb-2">{label}</p>
      <p
        className={`text-sm leading-relaxed ${
          isExpert ? 'text-[var(--landing-border)]' : 'text-[var(--landing-muted)]'
        }`}
      >
        {body}
      </p>
    </div>
  );
}

function StoryPortrait({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-sm">
      <Image src={src} alt={alt} fill className="object-cover object-top" sizes="(max-width: 640px) 280px, 360px" />
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
      className="hidden sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-8 lg:gap-12"
      data-testid="landing-story-static"
    >
      <div className="space-y-5">
        {genericHeadline}
        <StoryQuoteCard {...GENERIC_CARD} variant="generic" />
      </div>

      <div className="w-full max-w-[320px]">{portrait}</div>

      <div className="space-y-5">
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
      <div className="landing-story-stage relative mx-auto h-[min(78vh,700px)] w-full max-w-[1040px]">
        <div className="landing-story-generic-headline absolute left-0 top-[6%] max-w-[280px]">
          {genericHeadline}
        </div>

        <div className="landing-story-generic-card absolute left-6 lg:left-10 top-[26%] w-[min(42vw,250px)]">
          <StoryQuoteCard {...GENERIC_CARD} variant="generic" />
        </div>

        <div className="landing-story-portrait absolute left-1/2 top-[18%] w-full max-w-[min(34vw,320px)]">
          {portrait}
        </div>

        <div className="landing-story-expert-headline absolute right-0 top-[10%] max-w-[300px]">
          {expertHeadline}
        </div>

        <div className="landing-story-expert-card absolute right-6 lg:right-10 bottom-[14%] w-[min(42vw,270px)]">
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
      subtitle="Search results, forums, and advice that was not meant for you."
    />
  );

  const expertHeadline = (
    <StoryHeading
      title="Private expert access"
      subtitle="A person who can tell you what the path actually felt like."
      align="right"
    />
  );

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`landing-scroll-section landing-story-scrub py-10 sm:py-0 overflow-hidden${
        reducedMotion ? ' landing-story-scrub--static' : ''
      }`}
      data-testid="landing-story-scrub"
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
        <div className="sm:hidden">
          <LandingComparisonSlider
            portrait={portrait}
            beforeHeading={genericHeadline}
            afterHeading={expertHeadline}
            genericCard={<StoryQuoteCard {...GENERIC_CARD} variant="generic" />}
            expertCard={<StoryQuoteCard {...EXPERT_CARD} variant="expert" />}
          />
        </div>

        {reducedMotion ? (
          <StoryStaticDesktop
            portrait={portrait}
            genericHeadline={genericHeadline}
            expertHeadline={expertHeadline}
          />
        ) : (
          <StoryScrubDesktop
            portrait={portrait}
            genericHeadline={genericHeadline}
            expertHeadline={expertHeadline}
          />
        )}
      </div>
    </section>
  );
}