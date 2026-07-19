'use client';

import Image from 'next/image';
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
  const focusLabel = expert.expertise[0] ?? expert.category;
  const chromeRight =
    expert.availability === 'Available Now' ? 'Available' : 'Book';
  const chromeLeft = expert.introVideoUrl ? 'Intro video' : expert.category;

  return (
    <button
      type="button"
      data-testid={`expert-card-${expert.slug}`}
      aria-pressed={isSelected}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`experts-card group text-left w-full${isSelected ? ' is-selected' : ''}${expanded ? ' is-expanded' : ''}`}
    >
      <div className="experts-card__media">
        <Image
          src={toOptimizedImageUrl(expert.imageUrl)}
          alt={expert.name}
          fill
          priority={priority}
          className="experts-card__img object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
        />
        <div className="experts-card__chrome" aria-hidden={!expanded}>
          <span>{chromeLeft}</span>
          <span>{chromeRight}</span>
        </div>
      </div>

      <div className="experts-card__body">
        <h2 className="experts-card__name">{expert.name}</h2>
        <p className="experts-card__role">{expert.role}</p>
        <div className="experts-card__meta">
          <span className="experts-card__focus">{focusLabel}</span>
          <span className="experts-card__rate">${expert.rate} / hr</span>
        </div>
      </div>
    </button>
  );
}
