'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { MaterialIcon } from '@/components/ui/material-icon';
import { formatUsdFromCents } from '@/lib/session-duration';
import { toOptimizedImageUrl } from '@/lib/public-images';
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
    <form onSubmit={handlePay} className="vr-panel__body">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />
      <button
        type="submit"
        className="vr-submit"
        disabled={submitting || !stripe}
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
  const portraitSrc = toOptimizedImageUrl(expert.imageUrl);

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
    <div className="vr-page">
      <header className="vr-page__header">
        <div className="vr-page__header-inner">
          <Link href="/" className="vr-page__logo">
            AstroLink
          </Link>
          <Link href={`/experts/${expert.slug}`} className="vr-page__back">
            <MaterialIcon name="arrow_back" size={18} />
            <span>Back to {firstName}</span>
          </Link>
        </div>
      </header>

      <main className="vr-page__main">
        {/* Expert summary strip — not fighting the form for attention */}
        <aside className="vr-expert" aria-label="Expert">
          <div className="vr-expert__photo">
            <Image
              src={portraitSrc}
              alt={expert.name}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 88px, 120px"
              priority
            />
          </div>
          <div className="vr-expert__meta">
            <p className="vr-expert__eyebrow">Personal video</p>
            <h1 className="vr-expert__name">{expert.name}</h1>
            <p className="vr-expert__role">{expert.role}</p>
            <p className="vr-expert__price">
              <strong>{priceLabel}</strong>
              <span> · usually within {expert.videoRequestSlaDays} days</span>
            </p>
          </div>
        </aside>

        <section className="vr-panel" aria-labelledby="vr-panel-title">
          {success ? (
            <div className="vr-panel__body" data-testid="video-request-success">
              <h2 id="vr-panel-title" className="vr-panel__title">
                You&apos;re set
              </h2>
              <p className="vr-panel__lede">
                Check your email for confirmation. We&apos;ll send a private link when{' '}
                {firstName} delivers your video.
              </p>
              <Link href={`/experts/${expert.slug}`} className="vr-submit vr-submit--ghost">
                Back to profile
              </Link>
            </div>
          ) : clientSecret && stripePromise ? (
            <>
              <div className="vr-panel__head">
                <h2 id="vr-panel-title" className="vr-panel__title">
                  Payment
                </h2>
                <p className="vr-panel__lede">
                  {priceLabel} for a personal video from {firstName}.
                </p>
              </div>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#b4c5ff',
                      colorBackground: '#1a1a1a',
                      colorText: '#f5f5f5',
                      colorDanger: '#ffb4ab',
                      borderRadius: '10px',
                      fontFamily: 'system-ui, sans-serif',
                    },
                  },
                }}
              >
                <PayForm
                  onError={setError}
                  onSuccess={() => setSuccess(true)}
                  priceLabel={priceLabel}
                />
              </Elements>
              {error ? (
                <p className="vr-form-error" role="alert">
                  {error}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <div className="vr-panel__head">
                <h2 id="vr-panel-title" className="vr-panel__title">
                  Request details
                </h2>
                <p className="vr-panel__lede">
                  {firstName} will record a short private message and email you the link.
                </p>
              </div>

              <form
                onSubmit={startCheckout}
                className="vr-panel__body"
                data-testid="video-request-form"
                noValidate
              >
                <div className="vr-field">
                  <label htmlFor="vr-email" className="vr-label">
                    Email address
                  </label>
                  <input
                    id="vr-email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="vr-control"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="name@example.com"
                    data-testid="video-request-email"
                  />
                  <p className="vr-help">We send confirmation and the finished video here.</p>
                </div>

                <div className="vr-field-grid">
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
                      className="vr-control"
                      autoComplete="name"
                      placeholder="How they should address you"
                      data-testid="video-request-from"
                    />
                  </div>
                  <div className="vr-field">
                    <label htmlFor="vr-recipient" className="vr-label">
                      For
                      <span className="vr-label__optional">Optional</span>
                    </label>
                    <input
                      id="vr-recipient"
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="vr-control"
                      placeholder="Someone else's name"
                      data-testid="video-request-recipient"
                    />
                  </div>
                </div>

                <div className="vr-field">
                  <span className="vr-label" id="vr-occasion-label">
                    Occasion
                  </span>
                  <div
                    className="vr-toggle-group"
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
                            selected
                              ? 'vr-toggle vr-toggle--selected'
                              : 'vr-toggle'
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
                    Message notes
                  </label>
                  <textarea
                    id="vr-instructions"
                    required
                    minLength={12}
                    maxLength={1200}
                    rows={5}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="vr-control vr-control--area"
                    placeholder={`What should ${firstName} cover? Tone, names, anything to include.`}
                    data-testid="video-request-instructions"
                  />
                  <div className="vr-field-footer">
                    <p className="vr-help">A few sentences is enough.</p>
                    <p className="vr-count">{instructions.length}/1200</p>
                  </div>
                </div>

                {error ? (
                  <p className="vr-form-error" role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="vr-submit"
                  disabled={submitting}
                  data-testid="video-request-continue"
                >
                  {submitting ? 'Starting…' : `Continue · ${priceLabel}`}
                </button>
                <p className="vr-footnote">
                  Private video · emailed when ready
                  {skipStripe ? ' · (dev skip-stripe)' : ''}
                </p>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
