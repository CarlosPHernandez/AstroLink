'use client';

import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { FormAlert } from '@/components/forms/form-alert';
import { getPostBookingDashboardPath } from '@/lib/dashboard-paths';
import type { SessionData } from '@/lib/session';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

export type BookingCheckoutState = {
  bookingId: string;
  clientSecret: string;
  amountCents: number;
};

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function PaymentStepInner({
  checkout,
  onBack,
  sessionRole,
  variant = 'default',
  onPaymentComplete,
  onPaymentStarted,
  onPaymentFailed,
}: {
  checkout: BookingCheckoutState;
  onBack: () => void;
  sessionRole: SessionData['role'];
  variant?: 'default' | 'chris';
  /** Chris campaign only — keeps user in wizard instead of dashboard redirect. */
  onPaymentComplete?: (bookingId: string) => void;
  onPaymentStarted?: (bookingId: string) => void;
  onPaymentFailed?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    flushSync(() => {
      setPaying(true);
      setError(null);
    });
    onPaymentStarted?.(checkout.bookingId);

    const postBookingPath = getPostBookingDashboardPath(sessionRole, checkout.bookingId);
    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${postBookingPath}`,
      },
      redirect: 'if_required',
    });

    setPaying(false);

    if (submitError) {
      onPaymentFailed?.();
      setError(submitError.message ?? 'Payment failed');
      return;
    }

    if (onPaymentComplete) {
      onPaymentComplete(checkout.bookingId);
      router.refresh();
      return;
    }

    router.push(postBookingPath);
    router.refresh();
  };

  const isChris = variant === 'chris';

  return (
    <div className="space-y-6">
      <div
        className={
          isChris
            ? 'flex gap-3 rounded-lg border border-[#333333] bg-[#111111] p-4'
            : 'rounded-lg border border-outline-variant bg-surface-container-low p-4 flex gap-3'
        }
      >
        <span
          className={
            isChris
              ? 'material-symbols-outlined text-[22px] text-[#5b7fe6]'
              : 'material-symbols-outlined text-primary text-[22px]'
          }
        >
          account_balance
        </span>
        <p
          className={
            isChris
              ? 'text-sm leading-relaxed text-white/70'
              : 'text-label-md text-on-surface-variant leading-relaxed'
          }
        >
          Pay{' '}
          <strong className={isChris ? 'font-mono text-white' : 'text-on-surface font-mono'}>
            {formatMoney(checkout.amountCents)}
          </strong>
          {' '}
          when you book. Refunds follow the cancellation policy; mentor payout is handled
          after session completion.
        </p>
      </div>

      <div
        className={
          isChris
            ? 'rounded-xl border border-[#333333] bg-[#111111] p-5'
            : 'rounded-xl border border-outline-variant bg-surface-container-lowest p-5'
        }
      >
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      <FormAlert message={error} />

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className={
            isChris
              ? 'rounded-lg border border-[#333333] py-3 text-sm font-semibold text-white/70 transition-colors hover:bg-[#111111] sm:flex-1'
              : 'sm:flex-1 py-3 rounded-lg border border-outline-variant text-label-md font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors'
          }
        >
          Edit details
        </button>
        <button
          type="button"
          disabled={!stripe || paying}
          onClick={handlePay}
          className={
            isChris
              ? 'rounded-xl bg-white py-3.5 text-base font-semibold text-[#1c1c1c] transition-all hover:bg-gray-200 disabled:opacity-50 sm:flex-[2]'
              : 'sm:flex-[2] py-3.5 rounded-lg bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container disabled:opacity-50 transition-all'
          }
        >
          {paying ? 'Processing…' : `Pay ${formatMoney(checkout.amountCents)}`}
        </button>
      </div>
    </div>
  );
}

export function BookingPaymentStep({
  checkout,
  onBack,
  sessionRole,
  variant = 'default',
  onPaymentComplete,
  onPaymentStarted,
  onPaymentFailed,
}: {
  checkout: BookingCheckoutState;
  onBack: () => void;
  sessionRole: SessionData['role'];
  variant?: 'default' | 'chris';
  onPaymentComplete?: (bookingId: string) => void;
  onPaymentStarted?: (bookingId: string) => void;
  onPaymentFailed?: () => void;
}) {
  const elementsOptions =
    variant === 'chris'
      ? {
          clientSecret: checkout.clientSecret,
          appearance: {
            theme: 'night' as const,
            variables: {
              colorBackground: '#111111',
              colorText: '#ffffff',
              colorDanger: '#ba1a1a',
              borderRadius: '8px',
            },
          },
        }
      : { clientSecret: checkout.clientSecret };

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <PaymentStepInner
        checkout={checkout}
        onBack={onBack}
        sessionRole={sessionRole}
        variant={variant}
        onPaymentComplete={onPaymentComplete}
        onPaymentStarted={onPaymentStarted}
        onPaymentFailed={onPaymentFailed}
      />
    </Elements>
  );
}
