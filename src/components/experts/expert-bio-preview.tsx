'use client';

import { useState } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';
import { getBioPreview, isBioLong } from '@/lib/expert-bio';

type ExpertBioPreviewProps = {
  bio: string;
  /** Panel uses flex growth + internal scroll for the bio region.
   *  Sheet provides an outer scroll region in ExpertDetailContent (the sheet itself
   *  owns scrolling for variable-length content + a docked primary action footer).
   *  "Read more" simply expands the preview text inside that scroller. */
  variant: 'panel' | 'sheet';
};

const bioTextClass =
  'text-sm text-on-surface-variant font-light leading-relaxed';

export function ExpertBioPreview({ bio, variant }: ExpertBioPreviewProps) {
  const [expandedState, setExpandedState] = useState({ bio, expanded: false });
  const expanded = expandedState.bio === bio ? expandedState.expanded : false;
  const long = isBioLong(bio);

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
      : ''; // sheet: no internal height cap — parent scroll region owns length and scrolling

  return (
    <div className={wrapperClass}>
      <div className={expanded ? `${expandedScrollClass} ${bioTextClass}` : bioTextClass}>
        {expanded ? bio : getBioPreview(bio)}
      </div>
      <button
        type="button"
        onClick={() => setExpandedState({ bio, expanded: !expanded })}
        className="mt-2 inline-flex shrink-0 items-center gap-1.5 self-start text-[11px] font-mono font-semibold uppercase tracking-wider text-primary transition-colors hover:text-primary/70"
        aria-expanded={expanded}
      >
        <MaterialIcon name={expanded ? 'expand_less' : 'expand_more'} size={16} />
        {expanded ? 'Read less' : 'Read more'}
      </button>
    </div>
  );
}
