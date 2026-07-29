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
  priceLabel,
}: {
  onError: (msg: string) => void;
  onSuccess: () => void;
  priceLabel: string;
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
    <form onSubmit={handlePay} className="experts-pro-book experts-pro-form">
      <PaymentElement />
      <button
        type="submit"
        className="experts-pro-book-cta"
        disabled={submitting || !stripe}
        style={{ width: '100%', border: 0, cursor: 'pointer', marginTop: '1rem' }}
      >
        {submitting ? 'Processing…' : `Pay ${priceLabel} · Get your video`}
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
              A short private video from {firstName} — made for you, emailed when ready.
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
                <PayForm
                  onError={setError}
                  onSuccess={() => setSuccess(true)}
                  priceLabel={priceLabel}
                />
                {error ? (
                  <p className="experts-pro-book-note" style={{ color: '#ffb4ab' }} role="alert">
                    {error}
                  </p>
                ) : null}
              </Elements>
            ) : (
              <form
                onSubmit={startCheckout}
                className="experts-pro-book experts-pro-form"
                data-testid="video-request-form"
              >
                <label className="experts-pro-field">
                  <span className="experts-pro-field__label">Email</span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="experts-pro-field__input"
                    autoComplete="email"
                    placeholder="you@email.com"
                    data-testid="video-request-email"
                  />
                </label>

                <label className="experts-pro-field">
                  <span className="experts-pro-field__label">Your name</span>
                  <input
                    required
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    className="experts-pro-field__input"
                    autoComplete="name"
                    placeholder="How they should address you"
                    data-testid="video-request-from"
                  />
                </label>

                <label className="experts-pro-field">
                  <span className="experts-pro-field__label">
                    For <span className="experts-pro-field__optional">(optional)</span>
                  </span>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="experts-pro-field__input"
                    placeholder="Someone else's name, if not you"
                    data-testid="video-request-recipient"
                  />
                </label>

                <label className="experts-pro-field">
                  <span className="experts-pro-field__label">Occasion</span>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value as VideoRequestOccasion)}
                    className="experts-pro-field__input experts-pro-field__select"
                    data-testid="video-request-occasion"
                  >
                    {VIDEO_REQUEST_OCCASIONS.map((key) => (
                      <option key={key} value={key}>
                        {VIDEO_REQUEST_OCCASION_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="experts-pro-field">
                  <span className="experts-pro-field__label">What should {firstName} say?</span>
                  <textarea
                    required
                    minLength={12}
                    maxLength={1200}
                    rows={4}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="experts-pro-field__input experts-pro-field__textarea"
                    placeholder={`A few sentences for ${firstName} — context, tone, names, anything to include.`}
                    data-testid="video-request-instructions"
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
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
