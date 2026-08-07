'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { WRITTEN_REPORT_REVIEW_CENTS, WRITTEN_REPORT_REVIEW_SLA_DAYS } from '@/lib/path-assessment/written-review-pricing';
import { pathAssessmentResultsPath } from '@/lib/path-assessment/public-url';

type ExpertOption = {
  slug: string;
  name: string;
  role: string;
};

function PayForm({
  amountLabel,
  onError,
  onSuccess,
}: {
  amountLabel: string;
  onError: (msg: string) => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    onError('');
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
      redirect: 'if_required',
    });
    setSubmitting(false);
    if (error) {
      onError(error.message ?? 'Payment failed');
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={(e) => void handlePay(e)} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={submitting || !stripe}
        className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-full bg-[var(--landing-ink)] px-6 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        data-testid="written-review-pay"
      >
        {submitting ? 'Processing…' : `Pay ${amountLabel}`}
      </button>
    </form>
  );
}

export function WrittenReviewCheckout({
  assessmentToken,
  firstName,
  email,
  experts,
  stripePublishableKey,
}: {
  assessmentToken: string;
  firstName: string;
  email: string;
  experts: ExpertOption[];
  stripePublishableKey: string;
}) {
  const amountLabel = `$${(WRITTEN_REPORT_REVIEW_CENTS / 100).toFixed(0)}`;
  const [mentorSlug, setMentorSlug] = useState(experts[0]?.slug ?? '');
  const [buyerName, setBuyerName] = useState(firstName);
  const [buyerEmail, setBuyerEmail] = useState(email);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewToken, setReviewToken] = useState<string | null>(null);

  const stripePromise = useMemo(
    () => (stripePublishableKey ? loadStripe(stripePublishableKey) : null),
    [stripePublishableKey],
  );

  async function startCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!mentorSlug) {
      setError('Choose an expert.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/path-assessment/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentToken,
          mentorSlug,
          buyerEmail,
          buyerName,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        clientSecret?: string | null;
        skipStripe?: boolean;
        publicToken?: string;
      };
      if (!res.ok) {
        setError(data.error ?? 'Could not start checkout');
        setSubmitting(false);
        return;
      }
      if (data.publicToken) setReviewToken(data.publicToken);
      if (data.skipStripe) {
        setSuccess(true);
        setSubmitting(false);
        return;
      }
      if (!data.clientSecret) {
        setError('Payment could not be started');
        setSubmitting(false);
        return;
      }
      setClientSecret(data.clientSecret);
    } catch {
      setError('Network error');
    }
    setSubmitting(false);
  }

  if (success) {
    return (
      <div
        className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-6 sm:p-8 text-center"
        data-testid="written-review-success"
      >
        <h2 className="font-landing-display text-xl font-semibold text-[var(--landing-text)]">
          You&apos;re all set
        </h2>
        <p className="mt-3 text-sm text-[var(--landing-muted)] leading-relaxed">
          Your expert will review this Space Path Assessment and send a written response within about{' '}
          {WRITTEN_REPORT_REVIEW_SLA_DAYS} business days. We&apos;ll email you when it&apos;s ready.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {reviewToken ? (
            <Link
              href={`/assessment/reviews/${reviewToken}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--landing-ink)] px-5 text-sm font-semibold text-white"
            >
              View order status
            </Link>
          ) : null}
          <Link
            href={pathAssessmentResultsPath(assessmentToken)}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--landing-border)] px-5 text-sm font-medium text-[var(--landing-text)]"
          >
            Back to report
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10" data-testid="written-review-checkout">
      <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-5 sm:p-7">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--landing-faint)]">
          Written expert review
        </p>
        <h1 className="mt-2 font-landing-display text-2xl font-semibold text-[var(--landing-text)] tracking-tight">
          Get a human read on your report — {amountLabel}
        </h1>
        <p className="mt-3 text-sm text-[var(--landing-muted)] leading-relaxed">
          A verified expert reads your free Space Path Assessment and replies in writing with
          corrections, priorities, and next moves. Delivered in about {WRITTEN_REPORT_REVIEW_SLA_DAYS}{' '}
          business days.
        </p>
        <ul className="mt-5 space-y-2 text-sm text-[var(--landing-text)]">
          <li className="flex gap-2">
            <span className="text-[var(--landing-accent)]" aria-hidden>
              •
            </span>
            Your exact answers + Gemini report are attached
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--landing-accent)]" aria-hidden>
              •
            </span>
            Async — no live call required
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--landing-accent)]" aria-hidden>
              •
            </span>
            Still free to book a live session later with the same report
          </li>
        </ul>
      </div>

      <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-5 sm:p-7">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {error}
          </div>
        ) : null}

        {!clientSecret ? (
          <form onSubmit={(e) => void startCheckout(e)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--landing-text)] mb-1.5" htmlFor="expert">
                Choose expert
              </label>
              {experts.length === 0 ? (
                <p className="text-sm text-[var(--landing-muted)]">
                  No experts are accepting written reviews right now. Book a live session instead.
                </p>
              ) : (
                <select
                  id="expert"
                  className="w-full rounded-lg border border-[var(--landing-border)] bg-white px-3 py-3 text-sm"
                  value={mentorSlug}
                  onChange={(e) => setMentorSlug(e.target.value)}
                  data-testid="written-review-expert"
                >
                  {experts.map((ex) => (
                    <option key={ex.slug} value={ex.slug}>
                      {ex.name} — {ex.role}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="buyerName">
                  Your name
                </label>
                <input
                  id="buyerName"
                  className="w-full rounded-lg border border-[var(--landing-border)] px-3 py-3 text-sm"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="buyerEmail">
                  Email for delivery
                </label>
                <input
                  id="buyerEmail"
                  type="email"
                  className="w-full rounded-lg border border-[var(--landing-border)] px-3 py-3 text-sm"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[var(--landing-surface-soft)] px-4 py-3">
              <span className="text-sm text-[var(--landing-muted)]">Total due today</span>
              <span className="text-lg font-semibold text-[var(--landing-text)]">{amountLabel}</span>
            </div>
            <button
              type="submit"
              disabled={submitting || experts.length === 0}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--landing-ink)] px-6 text-sm font-semibold text-white disabled:opacity-50"
              data-testid="written-review-continue"
            >
              {submitting ? 'Starting checkout…' : `Continue to payment · ${amountLabel}`}
            </button>
            <p className="text-center text-xs text-[var(--landing-faint)]">
              <Link href={pathAssessmentResultsPath(assessmentToken)} className="underline-offset-2 hover:underline">
                Back to free report
              </Link>
            </p>
          </form>
        ) : clientSecret && stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PayForm
              amountLabel={amountLabel}
              onError={setError}
              onSuccess={() => setSuccess(true)}
            />
          </Elements>
        ) : null}
      </div>
    </div>
  );
}
