'use client';

import { ExpertIntroMedia } from '@/components/ExpertIntroMedia';

export type ChrisExpertPortraitProps = {
  name: string;
  imageUrl: string;
  introVideoUrl: string | null;
  subtitle?: string;
};

export function ChrisExpertPortrait({
  name,
  imageUrl,
  introVideoUrl,
  subtitle = 'Commercial Astronaut',
}: ChrisExpertPortraitProps) {
  return (
    <div
      className="chris-fade-in-up chris-delay-300 relative z-10 w-full shrink-0 md:max-w-[22rem] md:mx-auto lg:mx-0 lg:w-[41.666667%] lg:max-w-[28rem]"
      data-testid="chris-portrait"
    >
      <div className="chris-portrait-frame relative shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="chris-portrait-breathe">
          <ExpertIntroMedia
            name={name}
            imageUrl={imageUrl}
            introVideoUrl={introVideoUrl}
            priority
            overlayVariant="minimal"
            className="aspect-[4/5] w-full rounded-none border-0 bg-primary-container shadow-none"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[34%] bg-gradient-to-t from-primary-container via-primary-container/70 to-transparent"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end px-8 pb-8 pt-16">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-secondary-fixed-dim">
              Featured Expert
            </p>
            <p className="text-lg font-medium text-white">{name}</p>
            <p className="text-sm font-light text-secondary-fixed-dim">{subtitle}</p>
          </div>
        </div>
      </div>
      {introVideoUrl ? (
        <p className="mt-3 text-center text-xs font-light text-secondary-fixed-dim/60 md:text-left">
          Click to watch his intro
        </p>
      ) : null}
    </div>
  );
}