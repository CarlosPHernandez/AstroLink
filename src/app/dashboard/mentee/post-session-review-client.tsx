"use client";

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  bookingId: string;
};

export default function PostSessionReviewClient({ bookingId }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(5);
  const [quote, setQuote] = useState('');
  const [displayName, setDisplayName] = useState('Verified Astro-Link user');
  const [attributionType, setAttributionType] = useState('anonymous');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setError(null);
    setSuccess(null);
    if (!rating) return setError('Please choose a star rating.');
    if (quote.trim().length < 20) return setError('Please write at least 20 characters.');
    if (!displayName.trim()) return setError('Please provide a display name.');
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
        throw new Error(json?.error ?? 'Failed to submit review');
      }
      setSuccess(
        json?.data?.autoPublished
          ? 'Thanks — your feedback was submitted and may appear on the expert profile shortly.'
          : 'Thanks — your feedback was submitted. The expert can see it privately; public quotes go live after a quick review when needed.',
      );
      setQuote('');
      setConsent(false);
      // refresh to reflect any state change (e.g., hide CTA)
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setBusy(false);
    }
  }, [bookingId, rating, quote, displayName, attributionType, consent, router]);

  return (
    <div className="mt-4 p-4 border border-outline-variant rounded-md bg-surface-container-lowest">
      <h3 className="text-sm font-semibold">Leave feedback</h3>
      <p className="text-xs text-on-surface-variant mb-3">Share a short rating and quote about your session.</p>

      <div className="flex items-center gap-2 mb-3" aria-hidden>
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

      <label className="block text-xs mb-1">Your quote (20–600 chars)</label>
      <textarea
        rows={4}
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        className="w-full p-2 border border-outline-variant rounded-md mb-2 text-sm"
        placeholder="What did you find most helpful? Be specific so others can learn from your experience."
      />
      <div className="flex justify-between items-center text-xs text-on-surface-variant mb-3">
        <div>Characters: {quote.trim().length}</div>
        <div className="flex items-center gap-2">
          <label className="text-xs">Display name</label>
        </div>
      </div>

      <input
        className="w-full p-2 border border-outline-variant rounded-md mb-2 text-sm"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <label className="block text-xs mb-2">Attribution</label>
      <select
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
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span className="text-xs">I consent to this quote being published on the expert's public profile.</span>
      </label>

      {error ? <div className="text-sm text-error mb-2">{error}</div> : null}
      {success ? <div className="text-sm text-success mb-2">{success}</div> : null}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="px-4 py-2 rounded-md bg-primary text-white font-semibold disabled:opacity-50"
        >
          Submit review
        </button>
        <button
          type="button"
          onClick={() => {
            setQuote('');
            setRating(5);
            setDisplayName('Verified Astro-Link user');
            setConsent(false);
          }}
          className="px-4 py-2 rounded-md border border-outline-variant text-sm"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
