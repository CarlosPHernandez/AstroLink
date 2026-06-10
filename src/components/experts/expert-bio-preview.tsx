'use client';

import { useEffect, useState } from 'react';
import { getBioPreview, isBioLong } from '@/lib/expert-bio';

type ExpertBioPreviewProps = {
  bio: string;
  /** Panel uses flex growth; sheet uses a fixed scroll cap on small screens. */
  variant: 'panel' | 'sheet';
};

const bioTextClass =
  'text-sm text-on-surface-variant font-light leading-relaxed';

export function ExpertBioPreview({ bio, variant }: ExpertBioPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const long = isBioLong(bio);

  useEffect(() => {
    setExpanded(false);
  }, [bio]);

  const wrapperClass =
    variant === 'panel'
      ? 'mt-5 flex min-h-0 flex-1 flex-col'
      : 'mt-5 flex min-h-0 flex-col';

  if (!long) {
    return <p className={`mt-5 ${bioTextClass}`}>{bio}</p>;
  }

  const expandedScrollClass =
    variant === 'panel'
      ? 'min-h-0 flex-1 overflow-y-auto pr-1'
      : 'max-h-40 overflow-y-auto pr-1 sm:max-h-48';

  return (
    <div className={wrapperClass}>
      <div className={expanded ? `${expandedScrollClass} ${bioTextClass}` : bioTextClass}>
        {expanded ? bio : getBioPreview(bio)}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="mt-2 inline-flex shrink-0 items-center gap-1.5 self-start text-[11px] font-mono font-semibold uppercase tracking-wider text-primary transition-colors hover:text-primary/70"
        aria-expanded={expanded}
      >
        <span className="material-symbols-outlined text-[16px]">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
        {expanded ? 'Read less' : 'Read more'}
      </button>
    </div>
  );
}
