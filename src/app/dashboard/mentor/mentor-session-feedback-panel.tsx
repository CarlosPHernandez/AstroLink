'use client';

import React, { useCallback, useEffect, useState } from 'react';

type MentorReview = {
  id: string;
  rating: number;
  quote: string;
  displayName: string;
  status: string;
  moderationVerdict: string;
  moderationReason: string | null;
  autoPublished: boolean;
  createdAt: string;
  isFlagged: boolean;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Private session feedback for the mentor (not public profile). */
export function MentorSessionFeedbackPanel() {
  const [reviews, setReviews] = useState<MentorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mentor/expert-reviews');
      const payload = (await res.json()) as {
        success?: boolean;
        reviews?: MentorReview[];
        error?: string;
      };
      if (!res.ok || !payload.success || !payload.reviews) {
        throw new Error(payload.error ?? 'Unable to load session feedback.');
      }
      setReviews(payload.reviews);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load session feedback.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flaggedCount = reviews.filter((r) => r.isFlagged).length;

  return (
    <section
      className="rounded-md border border-outline-variant bg-surface-container-lowest p-5"
      data-testid="mentor-session-feedback"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
            Session feedback
          </p>
          <h2 className="text-lg font-semibold text-on-surface">What guests shared</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Private to you. Only consented, approved quotes appear on your public profile.
          </p>
        </div>
        {flaggedCount > 0 ? (
          <span className="rounded-full bg-warning/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-on-surface">
            {flaggedCount} flagged
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading feedback…</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No session feedback yet.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-md border border-outline-variant bg-surface p-3"
              data-testid="mentor-session-feedback-item"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-semibold">{review.rating}★</span>
                <span className="text-xs text-on-surface-variant">{formatDate(review.createdAt)}</span>
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {review.status}
                </span>
                {review.isFlagged ? (
                  <span className="rounded-full bg-warning/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest">
                    Needs team review
                  </span>
                ) : null}
                {review.autoPublished ? (
                  <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] uppercase tracking-widest">
                    On profile
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-on-surface leading-relaxed">“{review.quote}”</p>
              <p className="text-xs text-on-surface-variant mt-2">— {review.displayName}</p>
              {review.isFlagged && review.moderationReason ? (
                <p className="text-xs text-on-surface-variant mt-2 border-t border-outline-variant pt-2">
                  Screening note: {review.moderationReason}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
