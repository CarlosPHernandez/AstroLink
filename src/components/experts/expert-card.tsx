'use client';

import Image from 'next/image';
import { MaterialIcon } from '@/components/ui/material-icon';
import { formatFifteenMinuteRate } from '@/lib/booking-pricing';
import type { DirectoryExpert } from '@/lib/directory-expert';
import { landingFeaturedPortrait } from '@/lib/landing/featured-expert';

type ExpertCardProps = {
  expert: DirectoryExpert;
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
  const portrait = landingFeaturedPortrait(expert);
  const rating = expert.reviewSummary;

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
          src={portrait.src}
          alt={portrait.alt}
          fill
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          className="experts-card__img object-cover object-top"
          sizes="(max-width: 640px) 70vw, 260px"
        />
      </div>

      <div className="experts-card__body">
        <span className="experts-card__verified">Verified</span>
        <h2 className="experts-card__name">{expert.name}</h2>
        <p className="experts-card__role">
          {[expert.role, expert.employer].filter(Boolean).join(' · ')}
        </p>
        {rating && rating.count > 0 ? (
          <p className="experts-card__rating" data-testid={`expert-card-rating-${expert.slug}`}>
            <MaterialIcon name="star" size={14} className="experts-card__star" aria-hidden />
            <span>
              {rating.average.toFixed(1)}
              <span className="experts-card__rating-count"> ({rating.count})</span>
            </span>
          </p>
        ) : null}
        <p className="experts-card__rate">{formatFifteenMinuteRate(expert.liveSessionPriceCents)}</p>
      </div>
    </button>
  );
}
