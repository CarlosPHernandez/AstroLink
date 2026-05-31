'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { ListedExpert } from '@/lib/mentor-directory';
import { PRE_CALL_BRIEF_ADDON_CENTS } from '@/lib/booking-pricing';
import type { SessionData } from '@/lib/session';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

interface CheckoutState {
  bookingId: string;
  clientSecret: string;
  amountCents: number;
}

function PaymentStep({
  checkout,
  onBack,
}: {
  checkout: CheckoutState;
  onBack: () => void;
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

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/mentee?booked=${checkout.bookingId}`,
      },
      redirect: 'if_required',
    });

    setPaying(false);

    if (submitError) {
      setError(submitError.message ?? 'Payment failed');
      return;
    }

    router.push(`/dashboard/mentee?booked=${checkout.bookingId}`);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <p className="text-slate-400 text-sm">
        Total authorized: <span className="text-white font-mono">${(checkout.amountCents / 100).toFixed(2)}</span>{' '}
        (held until after your session)
      </p>
      <PaymentElement />
      {error ? <p className="text-rose-400 text-sm">{error}</p> : null}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!stripe || paying}
          onClick={handlePay}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold disabled:opacity-50"
        >
          {paying ? 'Authorizing…' : 'Authorize payment'}
        </button>
      </div>
    </div>
  );
}

export default function BookingClient({
  session,
  mentor,
}: {
  session: SessionData;
  mentor: ListedExpert | null;
}) {
  const [loading, setLoading] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    serviceType: 'session_1on1' as 'session_1on1' | 'pre_call_brief',
    includePreCallBrief: false,
    goals: '',
    background: '',
    scheduledAt: '',
  });

  const baseCents = mentor?.liveSessionPriceCents ?? 0;
  const totalCents =
    form.serviceType === 'pre_call_brief'
      ? PRE_CALL_BRIEF_ADDON_CENTS
      : baseCents + (form.includePreCallBrief ? PRE_CALL_BRIEF_ADDON_CENTS : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentor && form.serviceType === 'session_1on1') {
      setError('Choose an expert from the directory first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: mentor?.id,
          serviceType: form.serviceType,
          includePreCallBrief: form.includePreCallBrief,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          goals: form.goals,
          background: form.background,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Booking failed');
      }

      setCheckout({
        bookingId: json.data.bookingId,
        clientSecret: json.data.clientSecret,
        amountCents: json.data.amountCents,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-12 px-6">
      <div className="w-full max-w-xl border border-slate-900 bg-slate-950/80 p-8 rounded-2xl shadow-xl backdrop-blur-md relative">
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 mb-4 inline-block">
          ← Back to directory
        </Link>

        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Book an expert session</h2>
        <p className="text-slate-400 text-sm mb-2">
          Signed in as {session.fullName} ({session.email})
        </p>
        {mentor ? (
          <p className="text-cyan-400 text-sm mb-6 font-medium">
            Expert: {mentor.name} · ${mentor.rate}/session
          </p>
        ) : (
          <p className="text-amber-400/90 text-sm mb-6">
            No expert selected — APX-01 will match you from the approved roster.
          </p>
        )}

        {checkout?.clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret: checkout.clientSecret }}>
            <PaymentStep checkout={checkout} onBack={() => setCheckout(null)} />
          </Elements>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Session format
              </label>
              <select
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                value={form.serviceType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    serviceType: e.target.value as 'session_1on1' | 'pre_call_brief',
                  })
                }
              >
                <option value="session_1on1">Expert session (30 min)</option>
                <option value="pre_call_brief">Pre-call brief package only</option>
              </select>
            </div>

            {form.serviceType === 'session_1on1' ? (
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.includePreCallBrief}
                  onChange={(e) => setForm({ ...form, includePreCallBrief: e.target.checked })}
                  className="rounded border-slate-600"
                />
                Add pre-call brief (+${PRE_CALL_BRIEF_ADDON_CENTS / 100})
              </label>
            ) : null}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Session date & time
              </label>
              <input
                type="datetime-local"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Goals & questions for the expert
              </label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 resize-none"
                value={form.goals}
                onChange={(e) => setForm({ ...form, goals: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Your context
              </label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 resize-none"
                value={form.background}
                onChange={(e) => setForm({ ...form, background: e.target.value })}
              />
            </div>

            <p className="text-xs text-slate-500 font-mono">
              Estimated total: ${(totalCents / 100).toFixed(2)} USD (server-confirmed at checkout)
            </p>

            {error ? <p className="text-rose-400 text-sm">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Creating booking…' : 'Continue to payment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
