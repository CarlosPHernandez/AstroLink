import { MaterialIcon } from '@/components/ui/material-icon';
import type { PublicExpertReview } from '@/lib/expert-reviews/types';

function StarRow({ rating }: { rating: number }) {
  return (
    <div
      className="experts-pro-review-stars"
      role="img"
      aria-label={`Rated ${rating} out of 5`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < rating;
        return (
          <MaterialIcon
            key={i}
            name={filled ? 'star' : 'star_border'}
            size={16}
            className={filled ? 'experts-pro-review-star--filled' : 'experts-pro-review-star--empty'}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

/**
 * Session feedback on expert profiles.
 * Renders nothing when there are no approved reviews (no empty state chrome).
 */
export function ExpertReviews({ reviews }: { reviews: PublicExpertReview[] }) {
  if (!reviews.length) {
    return null;
  }

  const heading =
    reviews.length === 1
      ? 'What a recent session guest said'
      : 'What session guests are saying';

  return (
    <section
      className="experts-pro-reviews"
      data-testid="expert-profile-reviews"
      aria-label="Session feedback"
    >
      <p className="experts-pro-section-label">Session feedback</p>
      <h2>{heading}</h2>

      <ul className="experts-pro-reviews-list">
        {reviews.map((review) => (
          <li key={review.id} className="experts-pro-review-card" data-testid="expert-review-card">
            <StarRow rating={review.rating} />
            <blockquote className="experts-pro-review-quote">
              <p>“{review.quote}”</p>
            </blockquote>
            <div className="experts-pro-review-meta">
              <p className="experts-pro-review-attribution">{review.displayName}</p>
              {review.verifiedSession ? (
                <p className="experts-pro-review-verified">
                  <MaterialIcon name="verified" size={14} aria-hidden />
                  Verified Astro-Link session
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <p className="experts-pro-reviews-footnote">
        Shared with permission after a completed Astro-Link session.
      </p>
    </section>
  );
}
