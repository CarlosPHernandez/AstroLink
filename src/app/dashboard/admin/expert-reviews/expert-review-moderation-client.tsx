'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

const REVIEW_STATUSES = ['pending', 'approved', 'hidden', 'withdrawn'] as const;

type ReviewStatus = (typeof REVIEW_STATUSES)[number];

type ExpertReviewRow = {
  id: string;
  expert_id: string;
  booking_id: string | null;
  reviewer_user_id: string | null;
  rating: number;
  quote: string;
  display_name: string;
  attribution_type: string;
  consent_to_publish: boolean;
  status: string;
  source: string;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  mentors: { id: string; full_name: string; slug: string } | null;
  bookings: { status: string } | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ExpertReviewModerationClient() {
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('pending');
  const [reviews, setReviews] = useState<ExpertReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyReviewId, setBusyReviewId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/admin/expert-reviews?status=${encodeURIComponent(statusFilter)}`);
      const payload = (await response.json()) as {
        success?: boolean;
        reviews?: ExpertReviewRow[];
        error?: string;
      };
      if (!response.ok || !payload.success || !payload.reviews) {
        throw new Error(payload.error ?? 'Unable to load expert reviews.');
      }
      setReviews(payload.reviews);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load expert reviews.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const handleAction = useCallback(
    async (reviewId: string, action: 'approve' | 'hide' | 'withdraw') => {
      setBusyReviewId(reviewId);
      setActionMessage(null);
      try {
        const response = await fetch('/api/admin/expert-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewId, action }),
        });
        const payload = (await response.json()) as {
          success?: boolean;
          error?: string;
          reviewId?: string;
          status?: string;
        };
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? 'Unable to update review status.');
        }
        setActionMessage(`Review ${payload.reviewId} marked ${payload.status}.`);
        await fetchReviews();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to update review status.');
      } finally {
        setBusyReviewId(null);
      }
    },
    [fetchReviews],
  );

  const statusSelect = useMemo(
    () => (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <label htmlFor="review-status" className="text-xs uppercase tracking-widest text-on-surface-variant">
            Filter status
          </label>
          <select
            id="review-status"
            className="mt-1 block w-full sm:w-auto rounded-md border border-outline-variant bg-surface p-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ReviewStatus)}
          >
            {REVIEW_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40"
          onClick={() => void fetchReviews()}
          disabled={loading}
        >
          Refresh
        </button>
      </div>
    ),
    [fetchReviews, loading, statusFilter],
  );

  return (
    <div className="min-h-screen bg-background text-on-surface p-6 md:p-10">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <header className="rounded-md border border-outline-variant bg-surface-container-lowest p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <Link
                href="/dashboard/admin"
                className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-medium border border-outline-variant bg-surface hover:bg-surface/95"
              >
                ← Back to admin
              </Link>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                  Admin review moderation
                </p>
                <h1 className="text-2xl font-bold tracking-tight">Expert feedback queue</h1>
                <p className="text-sm text-on-surface-variant mt-1">
                  Review pending session feedback, publish public reviews, and hide or withdraw unsafe entries.
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
          {statusSelect}

          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading reviews…</p>
          ) : error ? (
            <p className="text-sm text-error">{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <caption className="sr-only">Expert review moderation table</caption>
                <thead>
                  <tr className="border-b border-outline-variant text-xs uppercase tracking-widest text-on-surface-variant">
                    <th className="px-3 py-2">Expert</th>
                    <th className="px-3 py-2">Booking</th>
                    <th className="px-3 py-2">Rating</th>
                    <th className="px-3 py-2">Quote</th>
                    <th className="px-3 py-2">Display name</th>
                    <th className="px-3 py-2">Consent</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {reviews.map((review) => (
                    <tr key={review.id}>
                      <td className="px-3 py-3 align-top">
                        <div className="font-medium text-on-surface">
                          {review.mentors?.full_name ?? 'Unknown expert'}
                        </div>
                        <div className="text-xs text-on-surface-variant">
                          {review.mentors?.slug ?? review.expert_id}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div>{review.booking_id ?? 'None'}</div>
                        <div className="text-xs text-on-surface-variant">{review.bookings?.status ?? 'unknown'}</div>
                      </td>
                      <td className="px-3 py-3 align-top">{review.rating}</td>
                      <td className="px-3 py-3 align-top max-w-[300px] break-words text-sm text-on-surface-variant">
                        {review.quote}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div>{review.display_name}</div>
                        <div className="text-xs text-on-surface-variant">{review.attribution_type}</div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span
                          className={`rounded-full py-1 px-2 text-[11px] uppercase tracking-widest ${
                            review.consent_to_publish
                              ? 'bg-success/15 text-on-surface'
                              : 'bg-error/15 text-on-surface'
                          }`}
                        >
                          {review.consent_to_publish ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="rounded-full bg-surface py-1 px-2 text-[11px] uppercase tracking-widest text-on-surface-variant">
                          {review.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top space-y-2">
                        <div className="grid gap-2">
                          <button
                            type="button"
                            className="rounded-md bg-success px-3 py-2 text-xs font-semibold text-black hover:bg-success/90 disabled:opacity-40"
                            onClick={() => void handleAction(review.id, 'approve')}
                            disabled={
                              busyReviewId === review.id ||
                              review.status === 'approved' ||
                              !review.consent_to_publish
                            }
                            title={
                              !review.consent_to_publish
                                ? 'Cannot approve without reviewer consent to publish'
                                : undefined
                            }
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="rounded-md bg-warning px-3 py-2 text-xs font-semibold text-black hover:bg-warning/90 disabled:opacity-40"
                            onClick={() => void handleAction(review.id, 'hide')}
                            disabled={busyReviewId === review.id || review.status === 'hidden'}
                          >
                            Hide
                          </button>
                          <button
                            type="button"
                            className="rounded-md bg-error px-3 py-2 text-xs font-semibold text-black hover:bg-error/90 disabled:opacity-40"
                            onClick={() => void handleAction(review.id, 'withdraw')}
                            disabled={busyReviewId === review.id || review.status === 'withdrawn'}
                          >
                            Withdraw
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {actionMessage ? (
            <p className="mt-4 rounded-md border border-outline-variant bg-surface p-3 text-sm text-success">
              {actionMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
