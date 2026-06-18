'use client';

import Image from 'next/image';
import { MaterialIcon } from '@/components/ui/material-icon';
import type { ListedExpert } from '@/lib/mentor-directory';
import { toOptimizedImageUrl } from '@/lib/public-images';

type ExpertCardProps = {
  expert: ListedExpert;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
  priority?: boolean;
};

export function ExpertCard({
  expert,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  priority = false,
}: ExpertCardProps) {
  const expanded = isSelected || isHovered;

  return (
    <button
      type="button"
      data-testid={`expert-card-${expert.slug}`}
      aria-pressed={isSelected}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`group text-left w-full flex flex-col overflow-hidden rounded-lg border bg-surface-container-lowest transition-all duration-300 cursor-pointer touch-manipulation ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10 scale-[1.02]'
          : expanded
            ? 'border-outline shadow-md scale-[1.02]'
            : 'border-outline-variant hover:border-outline hover:shadow-md'
      }`}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-container-low">
        <Image
          src={toOptimizedImageUrl(expert.imageUrl)}
          alt={expert.name}
          fill
          priority={priority}
          className={`object-cover transition-transform duration-500 ${
            expanded ? 'scale-105' : 'group-hover:scale-105'
          }`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {expert.introVideoUrl ? (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-white/25 bg-black/45 px-2.5 py-1 backdrop-blur-sm">
            <MaterialIcon name="play_circle" className="text-white" size={14} fill />
            <span className="font-mono text-[9px] uppercase tracking-wider text-white/90">Intro</span>
          </div>
        ) : null}
        {expert.availability === 'Available Now' ? (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white">
              Live
            </span>
          </div>
        ) : null}
      </div>

      <div className="p-4 flex items-end justify-between gap-2 border-t border-outline-variant/50">
        <div className="min-w-0">
          <p className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
            {expert.name}
          </p>
          <p className="text-label-sm text-on-surface-variant truncate mt-0.5">
            {expert.role}
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-mono font-semibold text-on-surface">
          ${expert.rate}/hr
        </span>
      </div>
    </button>
  );
}
