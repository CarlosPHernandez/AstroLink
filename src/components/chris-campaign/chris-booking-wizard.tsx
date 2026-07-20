'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useRef, useState } from 'react';
import {
  chrisWizardLoginAction,
  chrisWizardRegisterAction,
  type ChrisWizardAuthState,
} from '@/app/booking/chris-wizard-actions';
import '@/components/chris-campaign/chris-landing.css';
import { FormAlert } from '@/components/forms/form-alert';
import { FieldError } from '@/components/forms/field-error';
import {
  CHRIS_BOOKING_CAMPAIGN_QUERY,
  CHRIS_DISCOUNT_NAME,
  CHRIS_DISCOUNT_PERCENT,
  CHRIS_GOALS_MIN_CHARS,
} from '@/lib/chris-campaign/chris-campaign-constants';
import {
  clearDraft,
  isChrisDraftSessionComplete,
  loadDraft,
  saveDraft,
} from '@/lib/chris-campaign/chris-booking-draft';
import { getChrisCampaignDurationMinutes } from '@/lib/chris-campaign/chris-booking-mode';
import {
  trackChrisAuthSuccess,
  trackChrisBookingPageView,
  trackChrisCheckoutStart,
  trackChrisCheckoutSuccess,
  trackChrisPaymentError,
  trackChrisSessionContinue,
  type ChrisAuthMode,
} from '@/lib/chris-campaign/chris-campaign-analytics';
import {
  chrisEarlyAccessDiscountCents,
  resolveChrisChargeCents,
  resolveChrisOriginalPriceCents,
  resolveChrisPricingTier,
} from '@/lib/chris-campaign/chris-pricing';
import { useChrisWizardAnalytics } from '@/lib/chris-campaign/use-chris-wizard-analytics';

import { ChrisBookingFulfillmentOverlay } from '@/components/chris-campaign/chris-booking-fulfillment-overlay';
import { ChrisBookingNextSteps } from '@/components/chris-campaign/chris-booking-next-steps';
import { ChrisBriefingModal } from '@/components/chris-campaign/chris-briefing-modal';
import { useChrisBookingFulfillment } from '@/components/chris-campaign/use-chris-booking-fulfillment';
import { DurationStepper } from '@/components/experts/duration-stepper';
import { BookBodySchema } from '@/lib/book-request-schema';
import { getPostBookingDashboardPath } from '@/lib/dashboard-paths';
import type { ListedExpert } from '@/lib/mentor-directory';
import { toOptimizedImageUrl } from '@/lib/public-images';
import type { SessionData } from '@/lib/session';
import { clampSessionDurationMinutes } from '@/lib/session-duration';
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

/** Minimum perceived transition before revealing the payment summary step. */
const SESSION_TO_PAYMENT_TRANSITION_MS = 600;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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
  prefillDurationMinutes?: number;
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

function ChrisWizardProgress({
  step,
  signedIn,
}: {
  step: WizardStep;
  signedIn: boolean;
}) {
  // Goals-first order: signed-out session → account → payment; signed-in session → payment.
  const activeIndex = signedIn
    ? step === 'payment'
      ? 1
      : 0
    : step === 'session'
      ? 0
      : step === 'account'
        ? 1
        : 2;
  const segments = signedIn ? [0, 1] : [0, 1, 2];
  return (
    <div className="flex flex-col items-center gap-md py-md">
      <span className="text-[10px] font-medium uppercase tracking-widest text-white/40">
        Progress
      </span>
      <div className="flex items-center gap-xs">
        {segments.map((index) => (
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
  onAuthSuccess,
  onSuccess,
}: {
  onAuthSuccess: (mode: ChrisAuthMode) => void;
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
      onAuthSuccess(mode);
      router.refresh();
      onSuccess();
    }
  }, [authState, mode, onAuthSuccess, onSuccess, router]);

  return (
    <section className="w-full chris-form-max mx-auto">
      <div className="mb-lg space-y-xs">
        <h1 className="text-[32px] font-semibold leading-tight text-white">
          {mode === 'register' ? 'Create your account' : 'Sign in'}
        </h1>
        <p className="text-base text-white/70">
          {mode === 'register'
            ? 'Create an account to lock the session you already described.'
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
                ? 'Create account to lock this session'
                : 'Sign in to continue'}
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
  prefillDurationMinutes,
}: ChrisBookingWizardProps) {
  const router = useRouter();
  const defaultDurationMinutes = getChrisCampaignDurationMinutes();

  // Goals-first: default to session; mount hydrate may jump to account/payment from draft.
  const [step, setStep] = useState<WizardStep>('session');
  const [goals, setGoals] = useState('');
  const [background, setBackground] = useState('');
  const [scheduledAt, setScheduledAt] = useState(
    prefillScheduledAt ?? `${new Date().toISOString().slice(0, 10)}T12:00`,
  );
  const [durationMinutes, setDurationMinutes] = useState(() =>
    clampSessionDurationMinutes(prefillDurationMinutes ?? defaultDurationMinutes),
  );
  // Note: time is defaulted (day selection is the primary UI for the request phase per current scope).
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepTransitioning, setStepTransitioning] = useState(false);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);
  const fulfillment = useChrisBookingFulfillment();
  const wizardAnalytics = useChrisWizardAnalytics({ marketingReferrer });
  const checkoutSuccessTracked = useRef(false);
  const bookingPageViewTracked = useRef(false);
  const draftHydrated = useRef(false);

  const displayDate = prefillDate ?? scheduledAt.slice(0, 10);
  const chrisPricingTier = resolveChrisPricingTier(marketingReferrer);
  const chrisChargeCents = resolveChrisChargeCents(marketingReferrer, durationMinutes);
  const chrisOriginalPriceCents = resolveChrisOriginalPriceCents(durationMinutes);
  const chrisLaunchDiscountCents = chrisEarlyAccessDiscountCents(
    marketingReferrer,
    durationMinutes,
  );
  const isEarlyAccessPricing = chrisPricingTier === 'early_access';

  // Hydrate draft once on client mount (localStorage is client-only).
  useEffect(() => {
    if (draftHydrated.current) return;
    draftHydrated.current = true;

    const draft = loadDraft();
    const nextGoals = draft?.goals ?? '';
    const nextBackground = draft?.background ?? '';

    if (nextGoals.trim() || nextBackground.trim()) {
      setGoals(nextGoals);
      setBackground(nextBackground);
      setShowRestoreBanner(true);
    }

    let nextDurationMinutes = clampSessionDurationMinutes(
      prefillDurationMinutes ?? defaultDurationMinutes,
    );
    if (prefillDurationMinutes == null && draft?.durationMinutes != null) {
      nextDurationMinutes = clampSessionDurationMinutes(draft.durationMinutes);
      setDurationMinutes(nextDurationMinutes);
    }

    let nextScheduledAt =
      prefillScheduledAt ?? `${new Date().toISOString().slice(0, 10)}T12:00`;
    if (!prefillScheduledAt && draft?.scheduledAt) {
      nextScheduledAt = draft.scheduledAt;
      setScheduledAt(draft.scheduledAt);
    }

    const complete = isChrisDraftSessionComplete({
      goals: nextGoals,
      durationMinutes: nextDurationMinutes,
      scheduledAt: nextScheduledAt,
    });

    if (session && complete) {
      setStep('payment');
    } else if (!session && complete) {
      setStep('account');
    } else {
      setStep('session');
    }
  }, [defaultDurationMinutes, prefillDurationMinutes, prefillScheduledAt, session]);

  // Post-auth resume: complete draft/live form → payment; else session. Do not always force session.
  useEffect(() => {
    if (!session) return;
    if (step !== 'account') return;
    const draft = loadDraft();
    const complete = isChrisDraftSessionComplete({
      goals: draft?.goals ?? goals,
      durationMinutes: draft?.durationMinutes ?? durationMinutes,
      scheduledAt: draft?.scheduledAt ?? scheduledAt,
    });
    const liveComplete = isChrisDraftSessionComplete({
      goals,
      durationMinutes,
      scheduledAt,
    });
    const frame = window.requestAnimationFrame(() => {
      setStep(liveComplete || complete ? 'payment' : 'session');
    });
    return () => window.cancelAnimationFrame(frame);
  }, [session, step, goals, durationMinutes, scheduledAt]);

  useEffect(() => {
    if (bookingPageViewTracked.current) return;
    bookingPageViewTracked.current = true;
    trackChrisBookingPageView(marketingReferrer, session !== null);
    wizardAnalytics.reportLastStep('session');
  }, [marketingReferrer, session, wizardAnalytics]);

  useEffect(() => {
    if (checkout?.clientSecret) {
      wizardAnalytics.reportLastStep('stripe');
      return;
    }
    wizardAnalytics.reportLastStep(step);
  }, [checkout, step, wizardAnalytics]);

  useEffect(() => {
    if (fulfillment.view !== 'next_steps' || checkoutSuccessTracked.current) return;
    checkoutSuccessTracked.current = true;
    trackChrisCheckoutSuccess(marketingReferrer, chrisChargeCents);
    wizardAnalytics.reportPaid();
    clearDraft();
  }, [chrisChargeCents, fulfillment.view, marketingReferrer, wizardAnalytics]);

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
      durationMinutes,
      campaign: CHRIS_BOOKING_CAMPAIGN_QUERY,
      ...(marketingReferrer ? { marketingReferrer } : {}),
    };

    const parsed = BookBodySchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      setError(formLevelSummary());
      trackChrisPaymentError(marketingReferrer, 'validation');
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});
    fulfillment.beginPaymentOverlay();

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
        fulfillment.reset();
        if (json.fieldErrors) {
          setFieldErrors(json.fieldErrors);
          setError(json.error ?? formLevelSummary());
          trackChrisPaymentError(marketingReferrer, 'validation');
          return;
        }
        throw new Error(json.error ?? "We couldn't complete your booking. Try again.");
      }

      if (!json.data) {
        throw new Error("We couldn't complete your booking. Try again.");
      }

      trackChrisCheckoutStart(marketingReferrer, json.data.amountCents, {
        skipPayment: !!json.data.skipPayment,
      });
      wizardAnalytics.reportCheckoutStart();

      if (json.data.skipPayment) {
        router.refresh();
        void fulfillment.completePaymentAndFulfill(json.data.bookingId);
        return;
      }

      fulfillment.dismissOverlay();
      setCheckout(json.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      fulfillment.reset();
      trackChrisPaymentError(marketingReferrer, 'book_api');
      setError(err instanceof Error ? err.message : "We couldn't complete your booking. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const continueFromSession = () => {
    if (stepTransitioning) return;

    const payload = {
      mentorId: mentor.id,
      serviceType: 'session_1on1' as const,
      scheduledAt: new Date(scheduledAt).toISOString(),
      goals,
      background,
      durationMinutes,
      campaign: CHRIS_BOOKING_CAMPAIGN_QUERY,
    };

    const parsed = BookBodySchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      setError(formLevelSummary());
      trackChrisPaymentError(marketingReferrer, 'validation');
      return;
    }

    saveDraft({
      goals,
      background,
      durationMinutes,
      scheduledAt,
      date: displayDate,
      marketingReferrer,
    });
    trackChrisSessionContinue(marketingReferrer);
    wizardAnalytics.reportSessionContinue();

    setFieldErrors({});
    setError(null);

    if (!session) {
      setStep('account');
      setStepTransitioning(false);
      return;
    }

    setStepTransitioning(true);

    const advanceToPayment = () => {
      setStep('payment');
      setStepTransitioning(false);
    };

    if (prefersReducedMotion()) {
      advanceToPayment();
      return;
    }

    window.setTimeout(advanceToPayment, SESSION_TO_PAYMENT_TRANSITION_MS);
  };

  const handleChrisPaymentStarted = (bookingId: string) => {
    fulfillment.beginPaymentOverlay(bookingId);
  };

  const handleChrisPaymentComplete = (bookingId: string) => {
    void fulfillment.completePaymentAndFulfill(bookingId);
  };

  const handleChrisPaymentFailed = () => {
    fulfillment.reset();
    trackChrisPaymentError(marketingReferrer, 'stripe_confirm');
  };

  const handleAuthSuccess = (mode: ChrisAuthMode) => {
    trackChrisAuthSuccess(marketingReferrer, mode);
    wizardAnalytics.reportAuthSuccess(mode);
  };

  const nextStepsDateLabel = fulfillment.scheduledAt
    ? formatChrisSessionDate(fulfillment.scheduledAt.slice(0, 10))
    : formatChrisSessionDate(displayDate);

  if (fulfillment.view === 'next_steps' && fulfillment.bookingId) {
    return (
      <div
        className="chris-landing min-h-screen bg-primary-container font-sans text-white"
        data-testid="booking-chris-campaign"
      >
        <ChrisWizardHeader mentor={mentor} />
        <main className="chris-mobile-max mx-auto flex w-full flex-col gap-lg px-md pb-40 pt-lg">
          <ChrisBookingNextSteps
            mentorName={fulfillment.mentorName || mentor.name}
            sessionDateLabel={nextStepsDateLabel}
            bookingId={fulfillment.bookingId}
          />
        </main>
      </div>
    );
  }

  return (
    <div
      className="chris-landing min-h-screen bg-primary-container font-sans text-white"
      data-testid="booking-chris-campaign"
    >
      <ChrisWizardHeader mentor={mentor} />
      <ChrisWizardProgress
        step={checkout || stepTransitioning || fulfillment.isOverlayActive ? 'payment' : step}
        signedIn={session !== null}
      />

      {fulfillment.overlayPhase ? (
        <ChrisBookingFulfillmentOverlay
          phase={fulfillment.overlayPhase}
          thinkingStep={fulfillment.thinkingStep}
          errorMessage={fulfillment.errorMessage}
          onViewDashboard={
            fulfillment.bookingId
              ? () => {
                  router.push(
                    getPostBookingDashboardPath(session?.role ?? 'mentee', fulfillment.bookingId!),
                  );
                }
              : undefined
          }
        />
      ) : null}

      {fulfillment.view === 'brief' && fulfillment.briefing && fulfillment.bookingId ? (
        <ChrisBriefingModal
          mentorName={fulfillment.mentorName || mentor.name}
          briefing={fulfillment.briefing}
          bookingId={fulfillment.bookingId}
          userEmail={session?.email}
          onClose={fulfillment.closeBrief}
        />
      ) : null}

      <main className="chris-mobile-max mx-auto flex w-full flex-col gap-lg px-md pb-40 pt-lg">
        {checkout?.clientSecret && session ? (
          <div className="chris-form-max mx-auto w-full">
            <BookingPaymentStep
              checkout={checkout}
              onBack={() => setCheckout(null)}
              sessionRole={session.role}
              variant="chris"
              onPaymentStarted={handleChrisPaymentStarted}
              onPaymentComplete={handleChrisPaymentComplete}
              onPaymentFailed={handleChrisPaymentFailed}
            />
          </div>
        ) : (
          <>
            {step === 'account' ? (
              <ChrisWizardAccountStep
                onAuthSuccess={handleAuthSuccess}
                onSuccess={() => {
                  // Step advance is handled by the post-auth resume effect once
                  // session is available (payment if draft/live complete, else session).
                }}
              />
            ) : null}

            {step === 'session' ? (
              <section
                className={`chris-form-max mx-auto w-full transition-opacity duration-300 ${
                  stepTransitioning ? 'pointer-events-none opacity-40' : 'opacity-100'
                }`}
              >
                <div className="mb-lg space-y-xs">
                  <h1 className="text-[32px] font-semibold leading-tight text-white">
                    What do you want to cover?
                  </h1>
                  <p className="text-base text-white/70">
                    Chris uses this to prepare for your {durationMinutes}-minute session.
                  </p>
                  <p className="text-sm text-[#5b7fe6]">{durationMinutes}-minute live 1:1</p>
                </div>

                {showRestoreBanner ? (
                  <div
                    data-testid="chris-draft-restore-banner"
                    className="mb-md rounded-lg border border-white/15 bg-white/5 px-md py-sm text-sm text-white/90"
                    role="status"
                  >
                    <p>Continue where you left off</p>
                    <div className="mt-xs flex gap-sm">
                      <button type="button" onClick={() => setShowRestoreBanner(false)}>
                        Dismiss
                      </button>
                      <button
                        type="button"
                        data-testid="chris-draft-start-over"
                        onClick={() => {
                          clearDraft();
                          setGoals('');
                          setBackground('');
                          setShowRestoreBanner(false);
                          setStep('session');
                        }}
                      >
                        Start over
                      </button>
                    </div>
                  </div>
                ) : null}

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

                <div className="mb-md">
                  <DurationStepper value={durationMinutes} onChange={setDurationMinutes} />
                </div>

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
                      Your background (Optional)
                    </label>
                    <textarea
                      id="booking-background"
                      data-testid="booking-background"
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
                    Goals need at least {CHRIS_GOALS_MIN_CHARS} characters so Chris can prepare.
                    Background is optional.
                  </p>
                </div>

                <FormAlert message={error} />

                <div className="fixed bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-sm border-t border-[#333333] bg-[#1c1c1c] px-md pb-lg pt-md">
                  <button
                    type="button"
                    data-testid="booking-wizard-continue-session"
                    disabled={stepTransitioning}
                    onClick={continueFromSession}
                    className="chris-form-max flex w-full items-center justify-center gap-xs rounded-lg bg-white py-sm text-base font-bold tracking-tight text-primary-container shadow-sm transition-transform hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
                  >
                    {stepTransitioning ? (
                      <>
                        <span
                          className="h-4 w-4 animate-spin rounded-full border-2 border-primary-container border-t-transparent"
                          aria-hidden
                        />
                        Preparing checkout…
                      </>
                    ) : session ? (
                      'Continue to payment'
                    ) : (
                      'Continue to create account'
                    )}
                  </button>
                </div>
              </section>
            ) : null}

            {step === 'payment' ? (
              <section className="chris-form-max chris-fade-in-up mx-auto w-full">
                <div className="mb-6 overflow-hidden rounded-2xl border border-[#333333] bg-[#111111] p-6">
                  <h2 className="mb-4 text-base font-medium text-white">
                    Session with {mentor.name}
                  </h2>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between text-white/60">
                      <dt>Duration</dt>
                      <dd className="text-white">
                        {durationMinutes} minutes · Live video call
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

                  {/* Early-access: show list + discount. Public/social: full price (duration-scaled). */}
                  {isEarlyAccessPricing ? (
                    <div className="mt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between text-white/60">
                        <dt>Original price</dt>
                        <dd className="text-white line-through">
                          {formatMoney(chrisOriginalPriceCents)}
                        </dd>
                      </div>
                      <div className="flex justify-between text-white/60">
                        <dt>
                          {CHRIS_DISCOUNT_NAME} launch discount ({CHRIS_DISCOUNT_PERCENT}% off)
                        </dt>
                        <dd className="text-[#4ade80]">
                          -{formatMoney(chrisLaunchDiscountCents)}
                        </dd>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-white/60">
                      <p>Full session price (public booking).</p>
                    </div>
                  )}

                  <hr className="my-4 border-[#333333]" />
                  <div className="flex justify-between">
                    <span className="text-base font-bold text-white">Total</span>
                    <span className="text-xl font-bold text-white">
                      {formatMoney(chrisChargeCents)}
                    </span>
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
                  data-testid="chris-edit-session"
                  onClick={() => setStep('session')}
                  className="mb-3 w-full text-sm text-white/80 transition-colors hover:text-white"
                >
                  Edit goals or length
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
