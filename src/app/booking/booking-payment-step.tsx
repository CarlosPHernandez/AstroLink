'use client';

import React, { useState } from 'react';
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
}: {
  checkout: BookingCheckoutState;
  onBack: () => void;
  sessionRole: SessionData['role'];
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

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
      setError(submitError.message ?? 'Payment failed');
      return;
    }

    router.push(postBookingPath);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 flex gap-3">
        <span className="material-symbols-outlined text-primary text-[22px]">account_balance</span>
        <p className="text-label-md text-on-surface-variant leading-relaxed">
          Authorize{' '}
          <strong className="text-on-surface font-mono">{formatMoney(checkout.amountCents)}</strong>.
          Funds are captured only after your session completes successfully.
        </p>
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      <FormAlert message={error} />

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="sm:flex-1 py-3 rounded-lg border border-outline-variant text-label-md font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
        >
          Edit details
        </button>
        <button
          type="button"
          disabled={!stripe || paying}
          onClick={handlePay}
          className="sm:flex-[2] py-3.5 rounded-lg bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container disabled:opacity-50 transition-all"
        >
          {paying ? 'Authorizing…' : `Authorize ${formatMoney(checkout.amountCents)}`}
        </button>
      </div>
    </div>
  );
}

export function BookingPaymentStep({
  checkout,
  onBack,
  sessionRole,
}: {
  checkout: BookingCheckoutState;
  onBack: () => void;
  sessionRole: SessionData['role'];
}) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret: checkout.clientSecret }}>
      <PaymentStepInner checkout={checkout} onBack={onBack} sessionRole={sessionRole} />
    </Elements>
  );
}