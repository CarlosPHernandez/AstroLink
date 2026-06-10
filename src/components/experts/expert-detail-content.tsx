'use client';

import Link from 'next/link';
import { ExpertIntroMedia } from '@/components/ExpertIntroMedia';
import { ExpertBioPreview } from '@/components/experts/expert-bio-preview';
import { getExpertBookHref } from '@/lib/expert-book-href';
import type { ListedExpert } from '@/lib/mentor-directory';

type ExpertDetailContentProps = {
  expert: ListedExpert;
  isSignedIn: boolean;
  layout: 'panel' | 'sheet';
  onClose?: () => void;
};

function ExpertDetailActions({
  bookHref,
  firstName,
  rate,
  slug,
}: {
  bookHref: string;
  firstName: string;
  rate: number;
  slug: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Link
        href={bookHref}
        data-testid="expert-detail-book"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-container active:scale-[0.985]"
      >
        <span className="material-symbols-outlined text-[20px]">videocam</span>
        Book live 1:1 with {firstName} · ${rate}/hr
      </Link>
      <Link
        href={`/experts/${slug}`}
        className="inline-flex items-center justify-center rounded-lg border border-outline-variant px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
      >
        Full profile
      </Link>
    </div>
  );
}

function ExpertDetailMeta({
  expert,
  onClose,
}: {
  expert: ListedExpert;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-primary">
            Verified expert
          </p>
          <h2 className="text-xl font-bold tracking-tight text-on-surface">{expert.name}</h2>
          <p className="mt-1 font-mono text-xs uppercase text-on-surface-variant">{expert.role}</p>
          <p className="mt-0.5 text-xs text-on-surface-variant">{expert.employer}</p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface"
            aria-label="Close expert preview"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex shrink-0 flex-wrap gap-2">
        {expert.expertise.slice(0, 5).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-outline-variant bg-surface-container-low px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide text-on-surface-variant"
          >
            {tag}
          </span>
        ))}
      </div>
    </>
  );
}

export function ExpertDetailContent({
  expert,
  isSignedIn,
  layout,
  onClose,
}: ExpertDetailContentProps) {
  const bookHref = getExpertBookHref(expert.slug, isSignedIn);
  const firstName = expert.name.split(' ')[0];
  const isPanel = layout === 'panel';

  if (isPanel) {
    return (
      <div className="grid max-h-[min(78vh,680px)] grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="flex min-h-0 items-start justify-center lg:justify-start">
          <ExpertIntroMedia
            name={expert.name}
            imageUrl={expert.imageUrl}
            introVideoUrl={expert.introVideoUrl}
            autoPlayMuted
            priority
            className="aspect-[3/4] max-h-[min(78vh,680px)] w-full max-w-[420px]"
          />
        </div>

        <div className="flex h-full min-h-0 min-w-0 flex-col">
          <ExpertDetailMeta expert={expert} onClose={onClose} />
          <ExpertBioPreview bio={expert.bio} variant="panel" />
          <div className="mt-6 shrink-0 border-t border-outline-variant/60 pt-6">
            <ExpertDetailActions
              bookHref={bookHref}
              firstName={firstName}
              rate={expert.rate}
              slug={expert.slug}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-h-[calc(92vh-4rem)] min-h-0 flex-col gap-6">
      <div className="w-full shrink-0">
        <ExpertIntroMedia
          name={expert.name}
          imageUrl={expert.imageUrl}
          introVideoUrl={expert.introVideoUrl}
          autoPlayMuted
          priority
          className="mx-auto aspect-[3/4] w-full max-w-[min(100%,340px)]"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <ExpertDetailMeta expert={expert} onClose={onClose} />
        <ExpertBioPreview bio={expert.bio} variant="sheet" />
        <div className="mt-6 shrink-0 border-t border-outline-variant/60 pt-6">
          <ExpertDetailActions
            bookHref={bookHref}
            firstName={firstName}
            rate={expert.rate}
            slug={expert.slug}
          />
        </div>
      </div>
    </div>
  );
}
