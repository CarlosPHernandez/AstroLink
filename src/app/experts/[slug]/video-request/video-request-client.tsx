'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { ExpertIntroMedia } from '@/components/ExpertIntroMedia';
import { MaterialIcon } from '@/components/ui/material-icon';
import { formatUsdFromCents } from '@/lib/session-duration';
import {
  VIDEO_REQUEST_OCCASION_LABELS,
  VIDEO_REQUEST_OCCASIONS,
  type VideoRequestOccasion,
} from '@/lib/video-requests/types';

type ExpertProps = {
  slug: string;
  name: string;
  role: string;
  imageUrl: string;
  videoRequestPriceCents: number;
  videoRequestSlaDays: number;
};

function PayForm({
  onError,
  onSuccess,
}: {
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
    <form onSubmit={handlePay} className="experts-pro-book" style={{ marginTop: '1rem' }}>
      <PaymentElement />
      <button type="submit" className="experts-pro-book-cta" disabled={submitting || !stripe} style={{ marginTop: '1rem', width: '100%', border: 0, cursor: 'pointer' }}>
        {submitting ? 'Processing…' : 'Pay · Get your video'}
      </button>
    </form>
  );
}

export default function VideoRequestClient({
  expert,
  stripePublishableKey,
}: {
  expert: ExpertProps;
  stripePublishableKey: string;
}) {
  const firstName = expert.name.split(' ')[0];
  const priceLabel = formatUsdFromCents(expert.videoRequestPriceCents);

  const [email, setEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [occasion, setOccasion] = useState<VideoRequestOccasion>('career_advice');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [skipStripe, setSkipStripe] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const stripePromise = useMemo(
    () => (stripePublishableKey ? loadStripe(stripePublishableKey) : null),
    [stripePublishableKey],
  );

  async function startCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/video-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorSlug: expert.slug,
          buyerEmail: email,
          fromName,
          recipientName: recipientName || null,
          occasion,
          instructions,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        clientSecret?: string | null;
        skipStripe?: boolean;
      };
      if (!res.ok) {
        setError(data.error ?? 'Could not start checkout');
        setSubmitting(false);
        return;
      }
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
      setSkipStripe(false);
    } catch {
      setError('Network error');
    }
    setSubmitting(false);
  }

  return (
    <div className="experts-profile min-h-screen">
      <header className="experts-pro-header">
        <div className="experts-pro-header__inner">
          <Link href="/" className="experts-pro-logo">
            AstroLink
          </Link>
          <div className="experts-pro-header__nav">
            <Link href={`/experts/${expert.slug}`} className="experts-pro-dir-link">
              <MaterialIcon name="arrow_back" size={18} />
              <span className="hidden sm:inline">{firstName}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="experts-pro-main">
        <div className="experts-pro-hero">
          <div className="experts-pro-portrait">
            <ExpertIntroMedia
              name={expert.name}
              imageUrl={expert.imageUrl}
              introVideoUrl={null}
              className="experts-pro-media"
              priority
              overlayVariant="minimal"
            />
          </div>

          <div className="experts-pro-copy">
            <p className="experts-pro-eyebrow">Personal video</p>
            <h1>{expert.name}</h1>
            <p className="experts-pro-role">{expert.role}</p>
            <p className="experts-pro-lede">
              {firstName} will record a short message for you and email the private link.
            </p>

            <div className="experts-pro-price">
              <p className="experts-pro-price__total">
                {priceLabel}
                <span>video</span>
              </p>
              <p className="experts-pro-price__rate">
                Usually ready within {expert.videoRequestSlaDays} days · sent to your email
              </p>
            </div>

            {success ? (
              <div className="experts-pro-book" data-testid="video-request-success">
                <p className="experts-pro-lede" style={{ marginBottom: 0 }}>
                  You&apos;re set. Check your email for confirmation.
                </p>
                <p className="experts-pro-book-note">
                  We&apos;ll send a private link when {firstName} delivers your video.
                </p>
              </div>
            ) : clientSecret && stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PayForm onError={setError} onSuccess={() => setSuccess(true)} />
                {error ? (
                  <p className="experts-pro-book-note" style={{ color: '#ffb4ab' }} role="alert">
                    {error}
                  </p>
                ) : null}
              </Elements>
            ) : (
              <form onSubmit={startCheckout} className="experts-pro-book" data-testid="video-request-form">
                <label className="experts-pro-book-note" style={{ display: 'block', marginBottom: '0.75rem' }}>
                  Email
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="experts-pro-input"
                    autoComplete="email"
                    data-testid="video-request-email"
                  />
                </label>
                <label className="experts-pro-book-note" style={{ display: 'block', marginBottom: '0.75rem' }}>
                  Your name
                  <input
                    required
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    className="experts-pro-input"
                    autoComplete="name"
                    data-testid="video-request-from"
                  />
                </label>
                <label className="experts-pro-book-note" style={{ display: 'block', marginBottom: '0.75rem' }}>
                  For (optional)
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="experts-pro-input"
                    data-testid="video-request-recipient"
                  />
                </label>

                <p className="experts-pro-section-label" style={{ marginTop: '1rem' }}>
                  Occasion
                </p>
                <div className="experts-pro-chips" role="radiogroup" aria-label="Occasion">
                  {VIDEO_REQUEST_OCCASIONS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={occasion === key}
                      onClick={() => setOccasion(key)}
                      className={occasion === key ? 'experts-pro-chip-selected' : undefined}
                      style={
                        occasion === key
                          ? { borderColor: 'var(--pro-accent)', color: '#fff' }
                          : undefined
                      }
                    >
                      {VIDEO_REQUEST_OCCASION_LABELS[key]}
                    </button>
                  ))}
                </div>

                <label className="experts-pro-book-note" style={{ display: 'block', marginTop: '1rem' }}>
                  What should {firstName} say?
                  <textarea
                    required
                    minLength={12}
                    maxLength={1200}
                    rows={5}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="experts-pro-input"
                    data-testid="video-request-instructions"
                    style={{ resize: 'vertical' }}
                  />
                </label>

                {error ? (
                  <p className="experts-pro-book-note" style={{ color: '#ffb4ab' }} role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="experts-pro-book-cta"
                  disabled={submitting}
                  style={{ width: '100%', border: 0, cursor: 'pointer' }}
                  data-testid="video-request-continue"
                >
                  {submitting ? 'Starting…' : `Continue · ${priceLabel}`}
                </button>
                <p className="experts-pro-book-note">
                  Private video · link by email when ready
                  {skipStripe ? ' · (dev skip-stripe)' : ''}
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

    </div>
  );
}
