import { MaterialIcon } from '@/components/ui/material-icon';
import type { PublicExpertReview } from '@/lib/expert-reviews/types';

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
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
            size={size}
            className={filled ? 'experts-pro-review-star--filled' : 'experts-pro-review-star--empty'}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

/** Real average from the already-fetched review rows — never fabricated. */
function averageRating(reviews: PublicExpertReview[]): { average: number; count: number } {
  const count = reviews.length;
  if (count === 0) return { average: 0, count: 0 };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return { average: Math.round((total / count) * 10) / 10, count };
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
  const { average, count } = averageRating(reviews);

  return (
    <section
      className="experts-pro-reviews"
      data-testid="expert-profile-reviews"
      aria-label="Session feedback"
    >
      <p className="experts-pro-section-label">Session feedback</p>
      <h2>{heading}</h2>

      <div className="experts-pro-rating-summary" data-testid="expert-profile-rating-summary">
        <span className="experts-pro-rating-score">{average.toFixed(1)}</span>
        <div className="experts-pro-rating-meta">
          <div className="experts-pro-rating-stars-row">
            <StarRow rating={Math.round(average)} size={16} />
          </div>
          <p className="experts-pro-rating-count">
            Based on {count} completed {count === 1 ? 'session' : 'sessions'}
          </p>
        </div>
      </div>

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
