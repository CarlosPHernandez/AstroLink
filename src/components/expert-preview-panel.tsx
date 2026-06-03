'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ExpertIntroMedia } from '@/components/expert-intro-media';
import type { ListedExpert } from '@/lib/mentor-directory';

type ExpertPreviewPanelProps = {
  expert: ListedExpert;
  session: { userId: string } | null;
  onClose: () => void;
};

export function ExpertPreviewPanel({ expert, session, onClose }: ExpertPreviewPanelProps) {
  const bookHref = session
    ? `/booking?mentor=${encodeURIComponent(expert.slug)}`
    : '/auth';

  return (
    <div
      className="mb-8 animate-fade-slide-up overflow-hidden rounded-xl border border-primary/20 bg-surface-container-lowest shadow-lg shadow-primary/5"
      data-testid={`expert-preview-panel-${expert.slug}`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-outline-variant/40 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-outline-variant">
            <Image src={expert.imageUrl} alt="" fill className="object-cover" sizes="40px" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-on-surface">{expert.name}</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
              Quick preview
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary cursor-pointer"
          aria-label="Close preview"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <div className="grid gap-6 p-4 md:grid-cols-2 md:gap-8 md:p-6">
        <ExpertIntroMedia
          name={expert.name}
          imageUrl={expert.imageUrl}
          introVideoUrl={expert.introVideoUrl}
          className="aspect-[4/3] w-full md:aspect-[16/10]"
          autoPlay
        />

        <div className="flex flex-col">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            {expert.role}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">{expert.employer}</p>
          <p className="mt-4 flex-grow text-sm font-light leading-relaxed text-on-surface line-clamp-6 md:line-clamp-none">
            {expert.bio}
          </p>
          <ul className="mt-4 space-y-1.5">
            {expert.expertise.slice(0, 3).map((item) => (
              <li
                key={item}
                className="flex items-center text-[11px] text-on-surface-variant font-light"
              >
                <span
                  className="material-symbols-outlined mr-2 text-[14px] text-primary/70"
                  style={{ fontVariationSettings: "'wght' 600" }}
                >
                  check_circle
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/experts/${expert.slug}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-container"
            >
              Full profile
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
            <Link
              href={bookHref}
              className="inline-flex items-center rounded-md border border-outline-variant bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
            >
              {expert.availability === 'Available Now' ? 'Book session' : 'Schedule'}
            </Link>
            <span className="font-mono text-[11px] font-semibold text-on-surface">${expert.rate}/hr</span>
          </div>
        </div>
      </div>
    </div>
  );
}
