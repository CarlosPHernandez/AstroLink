'use client';

import Image from 'next/image';
import type { ListedExpert } from '@/lib/mentor-directory';
import { toOptimizedImageUrl } from '@/lib/public-images';

type BookingExpertPickerCardProps = {
  expert: ListedExpert;
  isSelected: boolean;
  onSelect: () => void;
  priority?: boolean;
};

export function BookingExpertPickerCard({
  expert,
  isSelected,
  onSelect,
  priority = false,
}: BookingExpertPickerCardProps) {
  return (
    <button
      type="button"
      data-testid={`booking-expert-${expert.slug}`}
      aria-pressed={isSelected}
      onClick={onSelect}
      className={`shrink-0 snap-start w-36 flex flex-col overflow-hidden rounded-lg border bg-surface-container-lowest text-left transition-all cursor-pointer touch-manipulation ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10'
          : 'border-outline-variant hover:border-outline hover:shadow-md'
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface-container-low">
        <Image
          src={toOptimizedImageUrl(expert.imageUrl)}
          alt=""
          fill
          priority={priority}
          className="object-cover"
          sizes="144px"
        />
      </div>
      <div className="p-3 border-t border-outline-variant/50 min-w-0">
        <p className="text-sm font-bold text-on-surface truncate">{expert.name}</p>
        <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant truncate mt-0.5">
          {expert.role}
        </p>
        <p className="text-[11px] font-mono font-semibold text-primary mt-2">${expert.rate}/hr</p>
      </div>
    </button>
  );
}