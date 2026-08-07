'use client';

import { useCallback, useEffect, useState } from 'react';

type ReviewRow = {
  id: string;
  publicToken: string;
  status: string;
  buyerName: string;
  buyerEmail: string;
  amountCents: number;
  dueAt: string | null;
  deliveredAt?: string | null;
  writtenResponse: string | null;
  assessment: {
    token: string;
    firstName: string;
    answers: unknown;
    report: unknown;
  } | null;
};

export function MentorReportReviewsPanel() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mentor/path-assessment-reviews');
      const data = (await res.json()) as { reviews?: ReviewRow[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');
      setReviews(data.reviews ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = reviews.find((r) => r.id === selectedId) ?? null;

  async function deliver() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/mentor/path-assessment-reviews/${selected.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ writtenResponse: draft }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Deliver failed');
      setDraft('');
      setSelectedId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deliver failed');
    } finally {
      setSubmitting(false);
    }
  }

  const open = reviews.filter((r) => r.status === 'paid' || r.status === 'in_progress');
  const done = reviews.filter((r) => r.status === 'delivered');

  return (
    <div data-testid="mentor-report-reviews-tab" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-on-surface">Report reviews</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Written reviews of mentee Space Path Assessments ($50). Open items first.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading ? <p className="text-sm text-on-surface-variant">Loading…</p> : null}

      {!loading && open.length === 0 && done.length === 0 ? (
        <p className="text-sm text-on-surface-variant">
          No written report reviews yet. When someone purchases a review of their assessment, it
          appears here.
        </p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Open ({open.length})
          </h3>
          {open.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setSelectedId(r.id);
                setDraft(r.writtenResponse ?? '');
              }}
              className={`w-full text-left rounded-lg border px-3 py-3 text-sm ${
                selectedId === r.id ? 'border-primary bg-surface-container' : 'border-outline-variant'
              }`}
            >
              <p className="font-medium">{r.buyerName || r.buyerEmail}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Due {r.dueAt ? new Date(r.dueAt).toLocaleDateString() : '—'} · $
                {(r.amountCents / 100).toFixed(0)}
              </p>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {selected ? (
            <>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Respond
              </h3>
              {selected.assessment?.report ? (
                <details className="rounded-lg border border-outline-variant px-3 py-2 text-sm">
                  <summary className="cursor-pointer font-medium">View AI report + answers</summary>
                  <pre className="mt-2 max-h-64 overflow-auto text-xs whitespace-pre-wrap">
                    {JSON.stringify(
                      {
                        answers: selected.assessment.answers,
                        report: selected.assessment.report,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </details>
              ) : null}
              <textarea
                className="w-full min-h-[180px] rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write your expert review: what the AI got right, priority gaps, next moves, and what a live session would cover…"
                data-testid="mentor-report-review-draft"
              />
              <button
                type="button"
                disabled={submitting || draft.trim().length < 40}
                onClick={() => void deliver()}
                className="inline-flex min-h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-50"
                data-testid="mentor-report-review-deliver"
              >
                {submitting ? 'Sending…' : 'Deliver written review'}
              </button>
            </>
          ) : (
            <p className="text-sm text-on-surface-variant">Select an open review to respond.</p>
          )}
        </div>
      </div>

      {done.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
            Delivered ({done.length})
          </h3>
          <ul className="space-y-1 text-sm text-on-surface-variant">
            {done.map((r) => (
              <li key={r.id}>
                {r.buyerName || r.buyerEmail}
                {r.deliveredAt ? ` · ${new Date(r.deliveredAt).toLocaleDateString()}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
