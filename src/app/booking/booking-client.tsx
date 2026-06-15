'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { ListedExpert } from '@/lib/mentor-directory';
import {
  PRE_CALL_BRIEF_ADDON_CENTS,
  computeBookingTotalCents,
} from '@/lib/booking-pricing';
import { FieldError } from '@/components/forms/field-error';
import { FormAlert } from '@/components/forms/form-alert';
import { BookBodySchema } from '@/lib/book-request-schema';
import type { SessionData } from '@/lib/session';
import {
  type FieldErrors,
  fieldErrorInputClass,
  firstFieldError,
  formLevelSummary,
  toFieldErrors,
} from '@/lib/zod-field-errors';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

const fieldClass =
  'w-full py-3 px-4 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow';

const sectionTitleClass = 'text-label-md font-semibold text-on-surface mb-1';
const sectionHintClass = 'text-label-sm text-on-surface-variant mb-4';

interface CheckoutState {
  bookingId: string;
  clientSecret: string;
  amountCents: number;
}

type BookingFormState = {
  serviceType: 'session_1on1' | 'pre_call_brief';
  goals: string;
  background: string;
  scheduledAt: string;
  // Variable duration for live sessions (slider in price summary). 15min min, up to 120.
  durationMinutes: number;
};

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function CheckoutProgress({ step, skipPayments }: { step: 1 | 2; skipPayments?: boolean }) {
  if (skipPayments) {
    return null;
  }

  const steps: { label: string; s: 1 | 2 }[] = [
    { label: 'Details', s: 1 },
    { label: 'Payment', s: 2 },
  ];
  return (
    <div className="mb-8 flex items-end gap-6 border-b border-outline-variant/50">
      {steps.map(({ label, s }) => {
        const active = step === s;
        const done = step > s;
        return (
          <div
            key={label}
            className={`pb-3 border-b-2 transition-colors ${
              active ? 'border-on-surface' : 'border-transparent'
            }`}
          >
            <span
              className={`text-label-md transition-colors ${
                active
                  ? 'font-semibold text-on-surface'
                  : done
                    ? 'text-on-surface-variant'
                    : 'text-outline'
              }`}
            >
              {done ? '✓ ' : ''}
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const expertAvatarClass =
  'relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low';

function SessionFormatPicker({
  value,
  onChange,
}: {
  value: BookingFormState['serviceType'];
  onChange: (v: BookingFormState['serviceType']) => void;
}) {
  const options: {
    id: BookingFormState['serviceType'];
    title: string;
    description: string;
    icon: string;
    priceHint: string;
  }[] = [
    {
      id: 'session_1on1',
      title: 'Live 1:1 session',
      description: 'Video call with your expert (15 min minimum, adjustable up to 2 hours).',
      icon: 'videocam',
      priceHint: 'Expert rate applies',
    },
    {
      id: 'pre_call_brief',
      title: 'Pre-call brief only',
      description: 'Written objectives and context — no live call.',
      icon: 'description',
      priceHint: formatMoney(PRE_CALL_BRIEF_ADDON_CENTS),
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
              selected
                ? 'border-primary bg-primary-fixed/30 shadow-[0_0_0_1px_rgba(0,88,188,0.08)]'
                : 'border-outline-variant bg-surface-container-lowest hover:border-outline hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <span
                className={`material-symbols-outlined text-[22px] ${
                  selected ? 'text-primary' : 'text-on-surface-variant'
                }`}
              >
                {opt.icon}
              </span>
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selected ? 'border-primary bg-primary' : 'border-outline-variant'
                }`}
              >
                {selected ? (
                  <span className="material-symbols-outlined text-on-primary text-[14px]">
                    check
                  </span>
                ) : null}
              </span>
            </div>
            <p className="text-body-md font-semibold text-on-surface">{opt.title}</p>
            <p className="text-label-md text-on-surface-variant mt-1 leading-snug">
              {opt.description}
            </p>
            <p className="text-label-sm font-mono text-primary mt-3">{opt.priceHint}</p>
          </button>
        );
      })}
    </div>
  );
}

function CheckoutSummary({
  mentor,
  form,
  totalCents,
  step,
  checkoutAmount,
  onDurationChange,
}: {
  mentor: ListedExpert | null;
  form: BookingFormState;
  totalCents: number;
  step: 1 | 2;
  checkoutAmount?: number;
  onDurationChange?: (minutes: number) => void;
}) {
  const displayTotal = checkoutAmount ?? totalCents;
  const isLive = form.serviceType === 'session_1on1';

  return (
    <div className="lg:sticky lg:top-24 space-y-4">
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low">
          <h3 className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            Summary
          </h3>
        </div>
        <div className="p-5 space-y-4">
          {mentor && isLive ? (
            <div className="flex gap-3 pb-4 border-b border-outline-variant/60">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-outline-variant">
                <Image src={mentor.imageUrl} alt="" fill className="object-cover" sizes="40px" />
              </div>
              <div className="min-w-0">
                <p className="text-label-md font-semibold text-on-surface truncate">{mentor.name}</p>
                <p className="text-label-sm text-on-surface-variant">
                Live session · {form.durationMinutes} min
              </p>
              </div>
            </div>
          ) : null}

          <dl className="space-y-2.5 text-label-md">
            <div className="flex justify-between gap-3">
              <dt className="text-on-surface-variant">
                {isLive ? 'Session' : 'Pre-call brief'}
              </dt>
              <dd className="font-mono text-on-surface tabular-nums shrink-0">
                {isLive && mentor ? formatMoney(mentor.liveSessionPriceCents) : formatMoney(PRE_CALL_BRIEF_ADDON_CENTS)}
              </dd>
            </div>
            {/* Brief is now included in the base mentor session price for live sessions (no separate add-on) */}
          </dl>

          {/* Variable duration slider (real-time price in summary card, per new direction).
              Prorates the mentor hourly rate (liveSessionPriceCents). 15min min enforced in compute. */}
          {isLive && onDurationChange && (
            <div className="pt-3 border-t border-outline-variant/60">
              <div className="flex items-center justify-between text-label-sm mb-1">
                <span className="text-on-surface-variant">Call length</span>
                <span className="font-mono text-on-surface">{form.durationMinutes} min</span>
              </div>
              <input
                type="range"
                min={15}
                max={120}
                step={5}
                value={form.durationMinutes}
                onChange={(e) => onDurationChange(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
                aria-label="Call duration in minutes (15 to 120)"
              />
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                15 min minimum • up to 2 hours • price updates live
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-outline-variant flex justify-between items-baseline">
            <span className="text-body-md font-semibold text-on-surface">
              {step === 2 ? 'Due today' : 'Estimated'}
            </span>
            <span className="text-headline-md font-bold text-primary tabular-nums">
              {formatMoney(displayTotal)}
            </span>
          </div>
          <p className="text-label-sm text-on-surface-variant leading-relaxed">
            {step === 2
              ? 'Authorization only — charged after your session ends.'
              : 'Final price confirmed on the next step.'}
          </p>
        </div>
      </div>

      <ul className="space-y-2.5 px-1">
        {[
          { icon: 'shield', text: 'Payment held in escrow until the call ends' },
          { icon: 'auto_awesome', text: 'AI briefing prepared before you join' },
          { icon: 'lock', text: 'Encrypted Daily video room' },
        ].map((item) => (
          <li key={item.text} className="flex items-center gap-2.5 text-label-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[18px]">{item.icon}</span>
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
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

export default function BookingClient({
  session,
  mentor,
  skipPayments = false,
}: {
  session: SessionData;
  mentor: ListedExpert | null;
  skipPayments?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState<BookingFormState>({
    serviceType: 'session_1on1',
    goals: '',
    background: '',
    scheduledAt: '',
    durationMinutes: 30, // default; slider will adjust (min 15 enforced in pricing)
  });

  const baseCents = mentor?.liveSessionPriceCents ?? 0;
  // Duration slider (in summary card) makes live 1:1 price dynamic (prorated hourly rate).
  // Briefing always bundled. pre_call_brief remains fixed.
  const totalCents = computeBookingTotalCents({
    serviceType: form.serviceType,
    liveSessionPriceCents: baseCents,
    includePreCallBrief: false,
    durationMinutes: form.serviceType === 'session_1on1' ? form.durationMinutes : undefined,
  });

  const step: 1 | 2 = checkout?.clientSecret ? 2 : 1;

  const submitBooking = async () => {
    if (!mentor && form.serviceType === 'session_1on1') {
      setFieldErrors({});
      setError('Choose an expert from the directory before booking a live session.');
      return;
    }

    const payload = {
      mentorId: mentor?.id,
      serviceType: form.serviceType,
      includePreCallBrief: false,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      goals: form.goals,
      background: form.background,
      durationMinutes: form.durationMinutes,
    };

    const parsed = BookBodySchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      setError(formLevelSummary());
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        fieldErrors?: FieldErrors;
        data?: CheckoutState & { skipPayment?: boolean };
      };

      if (!res.ok || !json.success) {
        if (json.fieldErrors) {
          setFieldErrors(json.fieldErrors);
          setError(json.error ?? formLevelSummary());
          return;
        }
        throw new Error(json.error ?? "We couldn't complete your booking. Try again.");
      }

      if (!json.data) {
        throw new Error("We couldn't complete your booking. Try again.");
      }

      if (json.data.skipPayment) {
        router.push(`/dashboard/mentee?booked=${json.data.bookingId}`);
        router.refresh();
        return;
      }

      setCheckout({
        bookingId: json.data.bookingId,
        clientSecret: json.data.clientSecret,
        amountCents: json.data.amountCents,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "We couldn't complete your booking. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitBooking();
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      <header className="border-b border-outline-variant/60 bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-on-surface tracking-tight">
            Astrolink
          </Link>
          <div className="flex items-center gap-3 text-label-md">
            <span className="text-on-surface-variant hidden sm:inline truncate max-w-[180px]">
              {session.fullName}
            </span>
            <span className="text-outline-variant hidden sm:inline">·</span>
            <Link href="/dashboard/mentee" className="text-primary font-semibold hover:underline">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <Link
            href="/experts"
            className="inline-flex items-center gap-0.5 text-label-md text-on-surface-variant hover:text-primary mb-5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            Directory
          </Link>

          {mentor ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={expertAvatarClass}>
                    <Image
                      src={mentor.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant leading-none mb-1">
                      {step === 1 ? 'Booking a session with' : 'Authorizing payment for'}
                    </p>
                    <h1 className="text-headline-lg-mobile sm:text-headline-lg font-bold tracking-tight text-on-surface truncate">
                      {mentor.name}
                    </h1>
                  </div>
                </div>
                <Link
                  href="/experts"
                  className="shrink-0 pt-5 text-label-sm text-on-surface-variant hover:text-primary transition-colors hidden sm:block"
                >
                  Change expert
                </Link>
              </div>
              <p className="mt-1.5 text-label-md text-on-surface-variant pl-12">
                {mentor.role}
                <span className="mx-1.5 text-outline-variant">·</span>
                {mentor.employer}
                <span className="mx-2 text-outline-variant">·</span>
                <span className="font-mono text-on-surface">${mentor.rate}</span>
                <span className="text-on-surface-variant"> / session</span>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-headline-lg-mobile sm:text-headline-lg font-bold tracking-tight text-on-surface">
                Complete your booking
              </h1>
              <p className="mt-2 text-label-md text-on-surface-variant">
                No expert selected.{' '}
                <Link href="/experts" className="text-primary hover:underline">
                  Browse the directory →
                </Link>
              </p>
            </>
          )}
        </div>

        <CheckoutProgress step={step} skipPayments={skipPayments} />

        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-8 lg:gap-10 items-start">
          <div className="min-w-0">
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5 sm:p-8">
              {checkout?.clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret: checkout.clientSecret }}>
                  <PaymentStep checkout={checkout} onBack={() => setCheckout(null)} />
                </Elements>
              ) : (
                <form onSubmit={handleSubmit} method="post" className="space-y-10">
                  <section>
                    <h2 className={sectionTitleClass}>Session type</h2>
                    <p className={sectionHintClass}>Choose how you want to work with an expert.</p>
                    <SessionFormatPicker
                      value={form.serviceType}
                      onChange={(serviceType) => setForm({ ...form, serviceType })}
                    />
                  </section>

                  {/* Pre-call briefing for the expert is now included by default with every live session (no extra charge or toggle). The intake below feeds the briefing generation. */}

                  <section>
                    <h2 className={sectionTitleClass}>Schedule</h2>
                    <p className={sectionHintClass}>Pick a time that works in your timezone.</p>
                    <label htmlFor="scheduledAt" className="sr-only">
                      Session date and time
                    </label>
                    <input
                      id="scheduledAt"
                      data-testid="booking-scheduled-at"
                      type="datetime-local"
                      required
                      className={fieldClass}
                      value={form.scheduledAt}
                      onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                    />
                  </section>

                  <section>
                    <h2 className={sectionTitleClass}>Session brief</h2>
                    <p className={sectionHintClass}>
                      Help your expert prepare — this feeds your automated briefing.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="goals" className="block text-label-sm text-on-surface mb-2">
                          Goals & questions
                        </label>
                        <textarea
                          id="goals"
                          data-testid="booking-goals"
                          required
                          rows={5}
                          placeholder="e.g. Review our comms architecture for a lunar relay mission…"
                          className={`${fieldErrorInputClass(!!firstFieldError(fieldErrors, 'goals'), fieldClass)} resize-none`}
                          value={form.goals}
                          aria-invalid={firstFieldError(fieldErrors, 'goals') ? true : undefined}
                          aria-describedby={
                            firstFieldError(fieldErrors, 'goals') ? 'booking-goals-error' : undefined
                          }
                          onChange={(e) => {
                            setForm({ ...form, goals: e.target.value });
                            if (fieldErrors.goals) {
                              setFieldErrors((prev) => {
                                const next = { ...prev };
                                delete next.goals;
                                return next;
                              });
                            }
                          }}
                        />
                        <FieldError
                          id="booking-goals-error"
                          message={firstFieldError(fieldErrors, 'goals')}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="background"
                          className="block text-label-sm text-on-surface mb-2"
                        >
                          Your background
                        </label>
                        <textarea
                          id="background"
                          data-testid="booking-background"
                          required
                          rows={5}
                          placeholder="Role, organization, and what you have already tried…"
                          className={`${fieldErrorInputClass(!!firstFieldError(fieldErrors, 'background'), fieldClass)} resize-none`}
                          value={form.background}
                          aria-invalid={firstFieldError(fieldErrors, 'background') ? true : undefined}
                          aria-describedby={
                            firstFieldError(fieldErrors, 'background')
                              ? 'booking-background-error'
                              : undefined
                          }
                          onChange={(e) => {
                            setForm({ ...form, background: e.target.value });
                            if (fieldErrors.background) {
                              setFieldErrors((prev) => {
                                const next = { ...prev };
                                delete next.background;
                                return next;
                              });
                            }
                          }}
                        />
                        <FieldError
                          id="booking-background-error"
                          message={firstFieldError(fieldErrors, 'background')}
                        />
                      </div>
                    </div>
                  </section>

                  <FormAlert message={error} />

                  <div className="pt-6 border-t border-outline-variant/50 flex flex-col items-start gap-2">
                    <button
                      type="button"
                      data-testid="booking-submit"
                      disabled={loading}
                      onClick={() => void submitBooking()}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-label-md font-medium text-on-primary hover:opacity-90 disabled:opacity-40 transition-opacity"
                    >
                      {loading
                        ? skipPayments
                          ? 'Generating AI briefing…'
                          : 'Creating booking…'
                        : skipPayments
                          ? 'Confirm booking'
                          : `Continue — ${formatMoney(totalCents)}`}
                    </button>
                    <p className="text-label-sm text-on-surface-variant">
                      {skipPayments
                        ? 'Payments skipped in dev — briefing generates immediately.'
                        : 'No charge until after the session.'}
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>

          <CheckoutSummary
            mentor={mentor}
            form={form}
            totalCents={totalCents}
            step={step}
            checkoutAmount={checkout?.amountCents}
            onDurationChange={(m) => setForm({ ...form, durationMinutes: m })}
          />
        </div>
      </main>
    </div>
  );
}
