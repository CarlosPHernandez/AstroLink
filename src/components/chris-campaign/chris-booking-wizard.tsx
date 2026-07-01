'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useMemo, useState } from 'react';
import {
  chrisWizardLoginAction,
  chrisWizardRegisterAction,
  type ChrisWizardAuthState,
} from '@/app/booking/chris-wizard-actions';
import '@/components/chris-campaign/chris-landing.css';
import { FormAlert } from '@/components/forms/form-alert';
import { FieldError } from '@/components/forms/field-error';
import { CHRIS_BOOKING_CAMPAIGN_QUERY } from '@/lib/chris-campaign/chris-campaign-constants';
import { getChrisCampaignDurationMinutes } from '@/lib/chris-campaign/chris-booking-mode';
import {
  computeBookingTotalCents,
} from '@/lib/booking-pricing';
import { BookBodySchema } from '@/lib/book-request-schema';
import { getPostBookingDashboardPath } from '@/lib/dashboard-paths';
import type { ListedExpert } from '@/lib/mentor-directory';
import { toOptimizedImageUrl } from '@/lib/public-images';
import type { SessionData } from '@/lib/session';
import {
  type FieldErrors,
  fieldErrorInputClass,
  firstFieldError,
  formLevelSummary,
  toFieldErrors,
} from '@/lib/zod-field-errors';

const BookingPaymentStep = dynamic(
  () =>
    import('@/app/booking/booking-payment-step').then((mod) => mod.BookingPaymentStep),
  {
    ssr: false,
    loading: () => (
      <p className="py-8 text-center text-sm text-secondary-fixed-dim">
        Loading secure checkout…
      </p>
    ),
  },
);

type WizardStep = 'account' | 'session' | 'payment';

type CheckoutState = {
  bookingId: string;
  clientSecret: string;
  amountCents: number;
};

type ChrisBookingWizardProps = {
  session: SessionData | null;
  mentor: ListedExpert;
  marketingReferrer: string | null;
  prefillScheduledAt: string | null;
  prefillDate: string | null;
};

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatChrisSessionDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function ChrisWizardProgress({ step }: { step: WizardStep }) {
  const activeIndex = step === 'account' ? 0 : step === 'session' ? 1 : 2;
  return (
    <div className="flex flex-col items-center gap-md py-md">
      <span className="text-[10px] font-medium uppercase tracking-widest text-white/40">
        Progress
      </span>
      <div className="flex items-center gap-xs">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={
              index <= activeIndex
                ? 'h-1 w-8 -skew-x-12 rounded-full bg-white'
                : 'h-1 w-8 -skew-x-12 rounded-full border border-white/20'
            }
          />
        ))}
      </div>
    </div>
  );
}

function ChrisWizardHeader({ mentor }: { mentor: ListedExpert }) {
  return (
    <header className="relative z-10 flex w-full flex-col items-center px-md pb-md pt-xl">
      <Link
        href="/talk-with-chris"
        className="absolute left-md top-md text-white/80 transition-opacity hover:opacity-100"
        aria-label="Back to Talk with Chris"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </Link>
      <div className="mb-xs flex h-12 w-12 overflow-hidden rounded-full border border-white/20">
        <Image
          src={toOptimizedImageUrl(mentor.imageUrl)}
          alt={mentor.name}
          width={48}
          height={48}
          className="h-full w-full object-cover"
        />
      </div>
      <p className="text-center text-[20px] font-semibold tracking-tight text-white">
        Book your call with {mentor.name}
      </p>
    </header>
  );
}

const chrisInputClass =
  'w-full rounded-lg border border-outline-variant/30 bg-[#111111] px-md py-sm text-white transition-all placeholder:text-white/40 focus:border-[#5b7fe6] focus:outline-none focus:ring-1 focus:ring-[#5b7fe6]';

const chrisTextareaClass = `${chrisInputClass} resize-none min-h-[120px]`;

const chrisLabelClass =
  'text-xs font-medium uppercase tracking-widest text-white/70';

function ChrisWizardAccountStep({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [registerState, registerAction, registerPending] = useActionState<
    ChrisWizardAuthState,
    FormData
  >(chrisWizardRegisterAction, {});
  const [loginState, loginAction, loginPending] = useActionState<
    ChrisWizardAuthState,
    FormData
  >(chrisWizardLoginAction, {});

  const authState = mode === 'register' ? registerState : loginState;
  const pending = mode === 'register' ? registerPending : loginPending;

  useEffect(() => {
    if (authState?.success && !authState.needsEmailConfirmation) {
      router.refresh();
      onSuccess();
    }
  }, [authState, onSuccess, router]);

  return (
    <section className="w-full chris-form-max mx-auto">
      <div className="mb-lg space-y-xs">
        <h1 className="text-[32px] font-semibold leading-tight text-white">
          {mode === 'register' ? 'Create your account' : 'Sign in'}
        </h1>
        <p className="text-base text-white/70">
          {mode === 'register'
            ? 'Introduce yourself to Chris!'
            : 'Welcome back — pick up where you left off.'}
        </p>
      </div>

      <FormAlert message={authState?.message ?? null} />

      <form
        action={mode === 'register' ? registerAction : loginAction}
        className="flex flex-col gap-md"
      >
        {mode === 'register' ? (
          <div className="flex flex-col gap-xs">
            <label className={chrisLabelClass} htmlFor="chris-wizard-fullname">
              Full name
            </label>
            <input
              id="chris-wizard-fullname"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              className={fieldErrorInputClass(
                !!authState?.errors?.fullName,
                chrisInputClass,
              )}
              placeholder="Your name"
            />
            <FieldError message={authState?.errors?.fullName?.[0]} />
          </div>
        ) : null}

        <div className="flex flex-col gap-xs">
          <label className={chrisLabelClass} htmlFor="chris-wizard-email">
            Email address
          </label>
          <input
            id="chris-wizard-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={fieldErrorInputClass(!!authState?.errors?.email, chrisInputClass)}
            placeholder="you@example.com"
          />
          <FieldError message={authState?.errors?.email?.[0]} />
        </div>

        <div className="flex flex-col gap-xs">
          <label className={chrisLabelClass} htmlFor="chris-wizard-password">
            Password
          </label>
          <input
            id="chris-wizard-password"
            name="password"
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            required
            minLength={8}
            className={fieldErrorInputClass(
              !!authState?.errors?.password,
              chrisInputClass,
            )}
            placeholder="••••••••"
          />
          <FieldError message={authState?.errors?.password?.[0]} />
          {mode === 'register' ? (
            <p className="mt-xs text-xs italic text-white/50">
              Password must be at least 8 characters
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-md pt-lg">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-white py-sm text-base font-bold tracking-tight text-primary-container shadow-sm transition-transform hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {pending
              ? 'Please wait…'
              : mode === 'register'
                ? 'Continue to Goals'
                : 'Continue'}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
            className="text-center text-sm text-white/80 underline-offset-4 hover:underline"
          >
            {mode === 'register'
              ? 'Already have an account? Sign in'
              : 'Need an account? Create one'}
          </button>
        </div>
      </form>
    </section>
  );
}

export function ChrisBookingWizard({
  session,
  mentor,
  marketingReferrer,
  prefillScheduledAt,
  prefillDate,
}: ChrisBookingWizardProps) {
  const router = useRouter();
  const chrisDurationMinutes = getChrisCampaignDurationMinutes();

  const initialStep: WizardStep = session ? 'session' : 'account';
  const [step, setStep] = useState<WizardStep>(initialStep);

  useEffect(() => {
    if (session && step === 'account') {
      setStep('session');
    }
  }, [session, step]);
  const [goals, setGoals] = useState('');
  const [background, setBackground] = useState('');
  const [scheduledAt, setScheduledAt] = useState(
    prefillScheduledAt ?? `${new Date().toISOString().slice(0, 10)}T12:00`,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);

  const totalCents = useMemo(
    () =>
      computeBookingTotalCents({
        serviceType: 'session_1on1',
        liveSessionPriceCents: mentor.liveSessionPriceCents,
        includePreCallBrief: false,
        durationMinutes: chrisDurationMinutes,
      }),
    [mentor.liveSessionPriceCents, chrisDurationMinutes],
  );

  const displayDate = prefillDate ?? scheduledAt.slice(0, 10);

  const submitBooking = async () => {
    if (!session) {
      setStep('account');
      setError('Sign in or create an account to continue.');
      return;
    }

    const payload = {
      mentorId: mentor.id,
      serviceType: 'session_1on1' as const,
      includePreCallBrief: false,
      scheduledAt: new Date(scheduledAt).toISOString(),
      goals,
      background,
      durationMinutes: chrisDurationMinutes,
      campaign: CHRIS_BOOKING_CAMPAIGN_QUERY,
      ...(marketingReferrer ? { marketingReferrer } : {}),
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
        router.push(getPostBookingDashboardPath(session.role, json.data.bookingId));
        router.refresh();
        return;
      }

      setCheckout(json.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "We couldn't complete your booking. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const continueFromSession = () => {
    const payload = {
      mentorId: mentor.id,
      serviceType: 'session_1on1' as const,
      scheduledAt: new Date(scheduledAt).toISOString(),
      goals,
      background,
      durationMinutes: chrisDurationMinutes,
      campaign: CHRIS_BOOKING_CAMPAIGN_QUERY,
    };

    const parsed = BookBodySchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      setError(formLevelSummary());
      return;
    }

    setFieldErrors({});
    setError(null);
    setStep('payment');
  };

  return (
    <div
      className="chris-landing min-h-screen bg-primary-container font-sans text-white"
      data-testid="booking-chris-campaign"
    >
      <ChrisWizardHeader mentor={mentor} />
      <ChrisWizardProgress step={checkout ? 'payment' : step} />

      <main className="chris-mobile-max mx-auto flex w-full flex-col gap-lg px-md pb-40 pt-lg">
        {checkout?.clientSecret && session ? (
          <div className="chris-form-max mx-auto w-full">
            <BookingPaymentStep
              checkout={checkout}
              onBack={() => setCheckout(null)}
              sessionRole={session.role}
              variant="chris"
            />
          </div>
        ) : (
          <>
            {step === 'account' ? (
              <ChrisWizardAccountStep onSuccess={() => setStep('session')} />
            ) : null}

            {step === 'session' ? (
              <section className="chris-form-max mx-auto w-full">
                <div className="mb-lg space-y-xs">
                  <h1 className="text-[32px] font-semibold leading-tight text-white">
                    What do you want to cover?
                  </h1>
                  <p className="text-base text-white/70">
                    Chris uses this to prepare for your {chrisDurationMinutes}-minute session.
                  </p>
                  <p className="text-sm text-[#5b7fe6]">{chrisDurationMinutes}-minute live 1:1</p>
                </div>

                <label htmlFor="booking-scheduled-at" className="sr-only">
                  Session date and time
                </label>
                <input
                  id="booking-scheduled-at"
                  data-testid="booking-scheduled-at"
                  type="datetime-local"
                  className="sr-only"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  tabIndex={-1}
                />

                <div className="flex flex-col gap-md">
                  <div className="flex flex-col gap-xs">
                    <label className={chrisLabelClass} htmlFor="booking-goals">
                      Goals &amp; questions
                    </label>
                    <textarea
                      id="booking-goals"
                      data-testid="booking-goals"
                      required
                      rows={4}
                      value={goals}
                      onChange={(e) => {
                        setGoals(e.target.value);
                        if (fieldErrors.goals) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.goals;
                            return next;
                          });
                        }
                      }}
                      className={fieldErrorInputClass(
                        !!firstFieldError(fieldErrors, 'goals'),
                        chrisTextareaClass,
                      )}
                      placeholder="e.g. Review our comms architecture for a lunar relay mission…"
                    />
                    <FieldError message={firstFieldError(fieldErrors, 'goals')} />
                  </div>

                  <div className="flex flex-col gap-xs">
                    <label className={chrisLabelClass} htmlFor="booking-background">
                      Your background
                    </label>
                    <textarea
                      id="booking-background"
                      data-testid="booking-background"
                      required
                      rows={4}
                      value={background}
                      onChange={(e) => {
                        setBackground(e.target.value);
                        if (fieldErrors.background) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.background;
                            return next;
                          });
                        }
                      }}
                      className={fieldErrorInputClass(
                        !!firstFieldError(fieldErrors, 'background'),
                        chrisTextareaClass,
                      )}
                      placeholder="Role, organization, and what you have already tried…"
                    />
                    <FieldError message={firstFieldError(fieldErrors, 'background')} />
                  </div>

                  <p className="flex items-start gap-xs text-[13px] text-white/50">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    At least 10 characters each — feeds your pre-call briefing.
                  </p>
                </div>

                <FormAlert message={error} />

                <div className="fixed bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-sm border-t border-[#333333] bg-[#1c1c1c] px-md pb-lg pt-md">
                  <button
                    type="button"
                    data-testid="booking-wizard-continue-session"
                    onClick={continueFromSession}
                    className="chris-form-max w-full rounded-lg bg-white py-sm text-base font-bold tracking-tight text-primary-container shadow-sm transition-transform hover:opacity-90 active:scale-[0.98]"
                  >
                    Continue to Payment
                  </button>
                  {!session ? (
                    <button
                      type="button"
                      onClick={() => setStep('account')}
                      className="text-xs uppercase tracking-widest text-white/70 hover:text-white"
                    >
                      Back
                    </button>
                  ) : null}
                </div>
              </section>
            ) : null}

            {step === 'payment' ? (
              <section className="chris-form-max mx-auto w-full">
                <div className="mb-6 overflow-hidden rounded-2xl border border-[#333333] bg-[#111111] p-6">
                  <h2 className="mb-4 text-base font-medium text-white">
                    Session with {mentor.name}
                  </h2>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between text-white/60">
                      <dt>Duration</dt>
                      <dd className="text-white">
                        {chrisDurationMinutes} minutes · Live video call
                      </dd>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <dt>Date</dt>
                      <dd className="text-white">{formatChrisSessionDate(displayDate)}</dd>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <dt>Pre-call briefing</dt>
                      <dd className="text-white">Included</dd>
                    </div>
                  </dl>
                  <hr className="my-4 border-[#333333]" />
                  <div className="flex justify-between">
                    <span className="text-base font-bold text-white">Total</span>
                    <span className="text-xl font-bold text-white">{formatMoney(totalCents)}</span>
                  </div>
                </div>

                <div className="mb-8 flex items-center justify-center gap-2 text-white/50">
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span className="text-[13px]">Secure checkout powered by Stripe</span>
                </div>

                <FormAlert message={error} />

                <button
                  type="button"
                  data-testid="booking-submit"
                  disabled={loading}
                  onClick={() => void submitBooking()}
                  className="mb-6 w-full rounded-xl bg-white py-4 text-base font-semibold text-[#1c1c1c] shadow-lg transition-transform hover:bg-gray-200 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Preparing checkout…' : 'Pay & confirm session'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('session')}
                  className="w-full text-sm text-white/60 transition-colors hover:text-white"
                >
                  Back
                </button>
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
