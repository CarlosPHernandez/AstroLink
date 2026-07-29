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
    <form onSubmit={handlePay} className="vr-form">
      <PaymentElement />
      <button
        type="submit"
        className="experts-pro-book-cta vr-form-submit"
        disabled={submitting || !stripe}
      >
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
              <div className="vr-form" data-testid="video-request-success">
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
                  <p className="vr-form-error" role="alert">
                    {error}
                  </p>
                ) : null}
              </Elements>
            ) : (
              <form onSubmit={startCheckout} className="vr-form" data-testid="video-request-form">
                <div className="vr-field">
                  <label htmlFor="vr-email" className="vr-label">
                    Email
                  </label>
                  <input
                    id="vr-email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="vr-input"
                    autoComplete="email"
                    placeholder="you@email.com"
                    data-testid="video-request-email"
                  />
                </div>

                <div className="vr-field-row">
                  <div className="vr-field">
                    <label htmlFor="vr-from" className="vr-label">
                      Your name
                    </label>
                    <input
                      id="vr-from"
                      required
                      type="text"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      className="vr-input"
                      autoComplete="name"
                      placeholder="First name"
                      data-testid="video-request-from"
                    />
                  </div>
                  <div className="vr-field">
                    <label htmlFor="vr-recipient" className="vr-label">
                      For <span className="vr-label-optional">(optional)</span>
                    </label>
                    <input
                      id="vr-recipient"
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="vr-input"
                      placeholder="Who is this for?"
                      data-testid="video-request-recipient"
                    />
                  </div>
                </div>

                <div className="vr-field">
                  <span className="vr-label" id="vr-occasion-label">
                    Occasion
                  </span>
                  <div
                    className="vr-occasion-badges"
                    role="radiogroup"
                    aria-labelledby="vr-occasion-label"
                  >
                    {VIDEO_REQUEST_OCCASIONS.map((key) => {
                      const selected = occasion === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setOccasion(key)}
                          className={
                            selected ? 'vr-occasion-badge vr-occasion-badge--on' : 'vr-occasion-badge'
                          }
                          data-testid={`video-request-occasion-${key}`}
                        >
                          {VIDEO_REQUEST_OCCASION_LABELS[key]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="vr-field">
                  <label htmlFor="vr-instructions" className="vr-label">
                    What should {firstName} say?
                  </label>
                  <textarea
                    id="vr-instructions"
                    required
                    minLength={12}
                    maxLength={1200}
                    rows={4}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="vr-input vr-textarea"
                    placeholder={`A few sentences for ${firstName} — context, tone, anything to include.`}
                    data-testid="video-request-instructions"
                  />
                  <p className="vr-field-hint">{instructions.length}/1200</p>
                </div>

                {error ? (
                  <p className="vr-form-error" role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="experts-pro-book-cta vr-form-submit"
                  disabled={submitting}
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
