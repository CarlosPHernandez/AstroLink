import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import type { LandingPublicReview } from '@/lib/expert-reviews/get-landing-public-reviews';

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < rating;
        return (
          <MaterialIcon
            key={i}
            name={filled ? 'star' : 'star_border'}
            size={18}
            className={filled ? 'text-[var(--landing-ink)]' : 'text-[var(--landing-border)]'}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

function ReviewCard({
  review,
  featured,
}: {
  review: LandingPublicReview;
  featured?: boolean;
}) {
  return (
    <article
      className={
        featured
          ? 'rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-5 sm:p-8 shadow-[0_16px_48px_-32px_rgba(14,20,32,0.2)]'
          : 'rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-4 sm:p-5'
      }
      data-testid="landing-review-card"
    >
      <StarRow rating={review.rating} />
      <blockquote className="mt-3 sm:mt-4">
        <p
          className={
            featured
              ? 'font-landing-display text-[1.0625rem] sm:text-xl font-medium leading-relaxed text-[var(--landing-text)] text-pretty'
              : 'text-sm sm:text-[0.9375rem] leading-relaxed text-[var(--landing-text)] text-pretty'
          }
        >
          “{review.quote}”
        </p>
      </blockquote>
      <div className="mt-4 sm:mt-5 flex flex-col gap-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--landing-text)]">{review.displayName}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--landing-muted)]">
          {review.verifiedSession ? (
            <span className="inline-flex items-center gap-1">
              <MaterialIcon name="verified" size={14} className="text-[var(--landing-accent)]" aria-hidden />
              Verified session
            </span>
          ) : null}
          {review.expertName ? (
            review.expertSlug ? (
              <Link
                href={`/experts/${review.expertSlug}`}
                className="underline-offset-2 hover:text-[var(--landing-text)] hover:underline"
              >
                with {review.expertName}
              </Link>
            ) : (
              <span>with {review.expertName}</span>
            )
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * Real session feedback for the landing page.
 * Renders nothing when empty (no fake testimonials).
 * Single review: featured quote. Multiple: compact grid (not a tall stack of huge cards).
 */
export function LandingReviews({ reviews }: { reviews: LandingPublicReview[] }) {
  if (!reviews.length) {
    return null;
  }

  const single = reviews.length === 1;
  const heading = single
    ? 'What a recent session guest said'
    : 'What session guests are saying';

  return (
    <section
      id="reviews"
      className="border-t border-[var(--landing-border)] py-10 sm:py-14 lg:py-16 scroll-mt-20"
      data-testid="landing-reviews"
      aria-labelledby="landing-reviews-heading"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <div className="max-w-[36rem]">
          <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--landing-faint)]">
            Session feedback
          </p>
          <h2
            id="landing-reviews-heading"
            className="mt-2 font-landing-display text-[1.25rem] sm:text-2xl font-semibold tracking-tight text-[var(--landing-text)] leading-snug text-balance"
          >
            {heading}
          </h2>
        </div>

        {single ? (
          <div className="mt-6 sm:mt-8 max-w-[40rem]">
            <ReviewCard review={reviews[0]!} featured />
          </div>
        ) : (
          <ul className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {reviews.map((review) => (
              <li key={review.id} className="min-w-0">
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
        )}

        <p className="mt-5 sm:mt-6 text-xs sm:text-sm text-[var(--landing-faint)] leading-relaxed max-w-prose">
          Shared with permission after a completed Astro-Link session.
        </p>
      </div>
    </section>
  );
}
