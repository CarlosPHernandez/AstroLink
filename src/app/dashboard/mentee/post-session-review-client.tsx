"use client";

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  bookingId: string;
  /** Server already found a review for this booking — hide the form. */
  alreadySubmitted?: boolean;
};

export default function PostSessionReviewClient({
  bookingId,
  alreadySubmitted = false,
}: Props) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(5);
  const [quote, setQuote] = useState('');
  const [displayName, setDisplayName] = useState('Verified Astro-Link user');
  const [attributionType, setAttributionType] = useState('anonymous');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(alreadySubmitted);

  const submit = useCallback(async () => {
    if (busy || submitted) return;
    setError(null);
    setSuccess(null);
    if (!rating) return setError('Please choose a star rating.');
    if (quote.trim().length < 20) return setError('Please write at least 20 characters.');
    if (displayName.trim().length < 2) return setError('Please provide a display name (2–80 characters).');
    setBusy(true);
    try {
      const res = await fetch('/api/expert-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          rating,
          quote: quote.trim(),
          displayName: displayName.trim(),
          attributionType,
          consentToPublish: consent,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        data?: { autoPublished?: boolean };
      };
      if (!res.ok) {
        // Already reviewed (race / refresh lag) — treat as done, hide form.
        if (res.status === 409 && typeof json?.error === 'string' && json.error.includes('already exists')) {
          setSubmitted(true);
          setSuccess('Thanks — feedback for this session was already submitted.');
          router.refresh();
          return;
        }
        throw new Error(json?.error ?? 'Failed to submit review');
      }
      setSubmitted(true);
      setSuccess(
        json?.data?.autoPublished
          ? 'Thanks — your feedback was submitted and may appear on the expert profile shortly.'
          : 'Thanks — your feedback was submitted. The expert can see it privately; public quotes go live after a quick review when needed.',
      );
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setBusy(false);
    }
  }, [busy, submitted, bookingId, rating, quote, displayName, attributionType, consent, router]);

  if (submitted) {
    return (
      <div
        className="mt-4 p-4 border border-outline-variant rounded-md bg-surface-container-lowest"
        data-testid="post-session-review-done"
      >
        <h3 className="text-sm font-semibold">Session feedback</h3>
        <p className="text-sm text-on-surface-variant mt-1">
          {success ?? 'You already shared feedback for this session. Thank you.'}
        </p>
      </div>
    );
  }

  return (
    <div
      className="mt-4 p-4 border border-outline-variant rounded-md bg-surface-container-lowest"
      data-testid="post-session-review-form"
      aria-busy={busy}
    >
      <h3 className="text-sm font-semibold">Leave feedback</h3>
      <p className="text-xs text-on-surface-variant mb-3">
        Share a short rating and quote about your session.
      </p>

      <fieldset disabled={busy} className="border-0 p-0 m-0 min-w-0 disabled:opacity-60">
        <div className="flex items-center gap-2 mb-3" role="group" aria-label="Star rating">
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={rating === s}
              onClick={() => setRating(s)}
              className={`px-2 py-1 rounded-md text-sm font-semibold ${rating === s ? 'bg-primary text-white' : 'bg-surface'}`}
            >
              {s}★
            </button>
          ))}
        </div>

        <label className="block text-xs mb-1" htmlFor={`review-quote-${bookingId}`}>
          Your quote (20–600 chars)
        </label>
        <textarea
          id={`review-quote-${bookingId}`}
          rows={4}
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          className="w-full p-2 border border-outline-variant rounded-md mb-2 text-sm"
          placeholder="What did you find most helpful? Be specific so others can learn from your experience."
        />
        <div className="flex justify-between items-center text-xs text-on-surface-variant mb-3">
          <div>Characters: {quote.trim().length}</div>
        </div>

        <label className="block text-xs mb-1" htmlFor={`review-display-name-${bookingId}`}>
          Display name
        </label>
        <input
          id={`review-display-name-${bookingId}`}
          className="w-full p-2 border border-outline-variant rounded-md mb-2 text-sm"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <label className="block text-xs mb-2" htmlFor={`review-attribution-${bookingId}`}>
          Attribution
        </label>
        <select
          id={`review-attribution-${bookingId}`}
          value={attributionType}
          onChange={(e) => setAttributionType(e.target.value)}
          className="w-full p-2 border border-outline-variant rounded-md mb-3 text-sm"
        >
          <option value="anonymous">Anonymous</option>
          <option value="role_only">Role only</option>
          <option value="first_name_only">First name only</option>
          <option value="organization">Organization</option>
          <option value="full_name">Full name</option>
        </select>

        <label className="flex items-center gap-2 text-sm mb-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span className="text-xs">
            I consent to this quote being published on the expert&apos;s public profile.
          </span>
        </label>
      </fieldset>

      {error ? (
        <div className="text-sm text-error mb-2" role="alert">
          {error}
        </div>
      ) : null}

      <div className="flex gap-2 items-center">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-w-[9.5rem]"
          aria-live="polite"
        >
          {busy ? (
            <>
              <span
                className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"
                aria-hidden
              />
              Submitting…
            </>
          ) : (
            'Submit review'
          )}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setQuote('');
            setRating(5);
            setDisplayName('Verified Astro-Link user');
            setConsent(false);
            setError(null);
          }}
          className="px-4 py-2 rounded-md border border-outline-variant text-sm disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
