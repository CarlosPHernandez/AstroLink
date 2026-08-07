'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookingExpertPicker } from '@/components/booking/booking-expert-picker';
import {
  SessionCompGrantBanner,
  type SessionCompGrantBannerGrant,
} from '@/components/booking/session-comp-grant-banner';
import { SessionSchedulePicker } from '@/components/booking/session-schedule-picker';
import type { ListedExpert } from '@/lib/mentor-directory';
import { toOptimizedImageUrl } from '@/lib/public-images';
import {
  PRE_CALL_BRIEF_ADDON_CENTS,
  computeBookingTotalCents,
} from '@/lib/booking-pricing';
import { FieldError } from '@/components/forms/field-error';
import { FormAlert } from '@/components/forms/form-alert';
import { CHRIS_BOOKING_CAMPAIGN_QUERY } from '@/lib/chris-campaign/chris-campaign-constants';
import { getChrisCampaignDurationMinutes } from '@/lib/chris-campaign/chris-booking-mode';
import { BookBodySchema } from '@/lib/book-request-schema';
import { getDashboardPathForRole, getPostBookingDashboardPath } from '@/lib/dashboard-paths';
import type { SessionData } from '@/lib/session';
import { SESSION_DURATION_MIN } from '@/lib/session-duration';
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
      <p className="text-sm text-on-surface-variant py-8 text-center">Loading secure checkout…</p>
    ),
  },
);

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
    <div
      className="grid sm:grid-cols-2 gap-3"
      role="radiogroup"
      aria-label="Session type"
    >
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
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
  showDurationSlider = true,
}: {
  mentor: ListedExpert | null;
  form: BookingFormState;
  totalCents: number;
  step: 1 | 2;
  checkoutAmount?: number;
  onDurationChange?: (minutes: number) => void;
  showDurationSlider?: boolean;
}) {
  const displayTotal = checkoutAmount ?? totalCents;
  const isLive = form.serviceType === 'session_1on1';

  return (
    <div id="booking-checkout-summary" className="lg:sticky lg:top-24 space-y-4">
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
                <Image
                  src={toOptimizedImageUrl(mentor.imageUrl)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="40px"
                />
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
                {isLive
                  ? mentor
                    ? `${formatMoney(mentor.liveSessionPriceCents)}/hr`
                    : '—'
                  : formatMoney(PRE_CALL_BRIEF_ADDON_CENTS)}
              </dd>
            </div>
            {/* Brief is now included in the base mentor session price for live sessions (no separate add-on) */}
          </dl>

          {/* Variable duration slider (real-time price in summary card, per new direction).
              Prorates the mentor hourly rate (liveSessionPriceCents). 15min min enforced in compute. */}
          {isLive && showDurationSlider !== false && onDurationChange && (
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

          {isLive && !mentor ? (
            <p className="pt-4 border-t border-outline-variant text-label-sm text-on-surface-variant">
              Select an expert to see your estimated total.
            </p>
          ) : (
            <div className="pt-4 border-t border-outline-variant flex justify-between items-baseline">
              <span className="text-body-md font-semibold text-on-surface">
                {step === 2 ? 'Due today' : 'Estimated'}
              </span>
              <span className="text-headline-md font-bold text-primary tabular-nums">
                {formatMoney(displayTotal)}
              </span>
            </div>
          )}
          <p className="text-label-sm text-on-surface-variant leading-relaxed">
            {step === 2
              ? 'Payment is collected when you book. Refunds follow the cancellation policy.'
              : 'Final price confirmed on the next step.'}
          </p>
        </div>
      </div>

      <ul className="space-y-2.5 px-1">
        {[
          { icon: 'shield', text: 'Full refund when cancelled at least 24 hours before start' },
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

export default function BookingClient({
  session,
  experts,
  mentor,
  invalidMentorSlug = null,
  skipPayments = false,
  chrisCampaign = false,
  prefillScheduledAt = null,
  prefillDurationMinutes = 30,
  initialCompGrant = null,
  assessmentToken = null,
}: {
  session: SessionData;
  experts: ListedExpert[];
  mentor: ListedExpert | null;
  invalidMentorSlug?: string | null;
  skipPayments?: boolean;
  chrisCampaign?: boolean;
  prefillScheduledAt?: string | null;
  prefillDurationMinutes?: number;
  initialCompGrant?: SessionCompGrantBannerGrant | null;
  /** Space Path Assessment public token from ?assessment= */
  assessmentToken?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pendingSlug, setPendingSlug] = useState<string | null>(mentor?.slug ?? null);
  const [showPicker, setShowPicker] = useState(!mentor);
  const [compGrant, setCompGrant] = useState<SessionCompGrantBannerGrant | null>(
    initialCompGrant,
  );
  const [applyCompGrant, setApplyCompGrant] = useState(false);
  const [attachedAssessmentToken, setAttachedAssessmentToken] = useState<string | null>(
    assessmentToken,
  );
  const [assessmentPrefillNote, setAssessmentPrefillNote] = useState<string | null>(null);
  const chrisDurationMinutes = getChrisCampaignDurationMinutes();
  const [form, setForm] = useState<BookingFormState>({
    serviceType: 'session_1on1',
    goals: '',
    background: '',
    scheduledAt: prefillScheduledAt ?? '',
    durationMinutes: chrisCampaign ? chrisDurationMinutes : prefillDurationMinutes,
  });

  useEffect(() => {
    if (!assessmentToken) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/path-assessment/${encodeURIComponent(assessmentToken)}`);
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as {
          success?: boolean;
          data?: {
            answers?: {
              primaryGoal?: string;
              experience?: string;
              stage?: string;
              network?: string;
              obstacle?: string;
              firstName?: string;
            };
          };
        };
        if (!json.success || !json.data?.answers || cancelled) return;
        const a = json.data.answers;
        const goals = [
          a.primaryGoal?.trim() ?? '',
          a.obstacle?.trim() ? `Biggest obstacle / clarity need: ${a.obstacle.trim()}` : '',
        ]
          .filter(Boolean)
          .join('\n\n');
        const background = [
          a.stage ? `Stage: ${a.stage}` : '',
          a.network ? `Network: ${a.network}` : '',
          a.experience?.trim() ?? '',
        ]
          .filter(Boolean)
          .join('\n');
        setForm((prev) => ({
          ...prev,
          goals: prev.goals.trim() ? prev.goals : goals,
          background: prev.background.trim() ? prev.background : background,
        }));
        setAttachedAssessmentToken(assessmentToken);
        setAssessmentPrefillNote(
          'Your Space Path Assessment is attached. Goals and background were prefilled — edit freely before booking.',
        );
      } catch {
        // Prefill is optional; booking still works without it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assessmentToken]);

  useEffect(() => {
    if (initialCompGrant) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/me/session-comp-grant');
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          available?: boolean;
          grantId?: string;
          creditMinutes?: number;
          expiresAt?: string | null;
        };
        if (data.available && data.grantId && !cancelled) {
          setCompGrant({
            id: data.grantId,
            creditMinutes: data.creditMinutes ?? 15,
            expiresAt: data.expiresAt ?? null,
          });
        }
      } catch {
        // Banner optional if lookup fails
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialCompGrant]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPendingSlug(mentor?.slug ?? null);
      if (mentor) {
        setShowPicker(false);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mentor]);

  const activeMentor = useMemo(() => {
    if (pendingSlug) {
      return experts.find((expert) => expert.slug === pendingSlug) ?? mentor ?? null;
    }
    return mentor;
  }, [pendingSlug, experts, mentor]);

  const needsExpert = form.serviceType === 'session_1on1';
  const pickerVisible = !chrisCampaign && needsExpert && (showPicker || !activeMentor);

  const handleSelectExpert = (slug: string) => {
    setPendingSlug(slug);
    setShowPicker(false);
    setError(null);
    router.replace(`/booking?mentor=${encodeURIComponent(slug)}`, { scroll: false });
  };

  const handleChangeExpert = () => {
    setShowPicker(true);
    router.replace('/booking', { scroll: false });
  };

  const handleClearExpertSelection = () => {
    setPendingSlug(null);
    setShowPicker(true);
    router.replace('/booking', { scroll: false });
  };

  const baseCents = activeMentor?.liveSessionPriceCents ?? 0;
  // Duration slider (in summary card) makes live 1:1 price dynamic (prorated hourly rate).
  // Briefing always bundled. pre_call_brief remains fixed.
  const listTotalCents = computeBookingTotalCents({
    serviceType: form.serviceType,
    liveSessionPriceCents: baseCents,
    includePreCallBrief: false,
    durationMinutes: form.serviceType === 'session_1on1' ? form.durationMinutes : undefined,
  });
  const effectiveDuration = chrisCampaign ? chrisDurationMinutes : form.durationMinutes;
  const canApplyComp =
    Boolean(compGrant) &&
    form.serviceType === 'session_1on1' &&
    effectiveDuration === SESSION_DURATION_MIN;
  const totalCents =
    applyCompGrant && canApplyComp ? 0 : listTotalCents;

  useEffect(() => {
    if (applyCompGrant && !canApplyComp) {
      setApplyCompGrant(false);
    }
  }, [applyCompGrant, canApplyComp]);

  const step: 1 | 2 = checkout?.clientSecret ? 2 : 1;

  const submitBooking = async () => {
    if (!activeMentor && form.serviceType === 'session_1on1') {
      setFieldErrors({});
      setShowPicker(true);
      setError('Choose an expert above before booking a live session.');
      return;
    }

    const payload = {
      mentorId: activeMentor?.id,
      serviceType: form.serviceType,
      includePreCallBrief: false,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      goals: form.goals,
      background: form.background,
      durationMinutes: chrisCampaign ? chrisDurationMinutes : form.durationMinutes,
      ...(chrisCampaign ? { campaign: CHRIS_BOOKING_CAMPAIGN_QUERY } : {}),
      ...(applyCompGrant && canApplyComp && compGrant
        ? { applyCompGrantId: compGrant.id }
        : {}),
      ...(attachedAssessmentToken
        ? { assessmentToken: attachedAssessmentToken }
        : {}),
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
    <div
      className="min-h-screen bg-background text-on-surface font-sans"
      data-testid={chrisCampaign ? 'booking-chris-campaign' : undefined}
    >
      <header className="border-b border-outline-variant/60 bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-on-surface tracking-tight">
            AstroLink
          </Link>
          <div className="flex items-center gap-3 text-label-md">
            <span className="text-on-surface-variant hidden sm:inline truncate max-w-[180px]">
              {session.fullName}
            </span>
            <span className="text-outline-variant hidden sm:inline">·</span>
            <Link
              href={getDashboardPathForRole(session.role)}
              className="text-primary font-semibold hover:underline"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main
        className={`max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 ${
          needsExpert && step === 1 ? 'pb-28 lg:pb-12' : ''
        }`}
      >
        <div className="mb-8">
          <Link
            href={chrisCampaign ? '/talk-with-chris' : '/experts'}
            className="inline-flex items-center gap-0.5 text-label-md text-on-surface-variant hover:text-primary mb-5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            {chrisCampaign ? 'Talk with Chris' : 'Directory'}
          </Link>

          {activeMentor && !showPicker ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={expertAvatarClass}>
                    <Image
                      src={toOptimizedImageUrl(activeMentor.imageUrl)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant leading-none mb-1">
                      {step === 1 ? 'Booking a session with' : 'Payment for'}
                    </p>
                    <h1 className="text-headline-lg-mobile sm:text-headline-lg font-bold tracking-tight text-on-surface truncate">
                      {activeMentor.name}
                    </h1>
                  </div>
                </div>
                {step === 1 && !chrisCampaign ? (
                  <button
                    type="button"
                    onClick={handleChangeExpert}
                    className="shrink-0 pt-5 text-label-sm text-on-surface-variant hover:text-primary transition-colors"
                  >
                    Change expert
                  </button>
                ) : null}
              </div>
              <p className="mt-1.5 text-label-md text-on-surface-variant pl-0 sm:pl-12 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="truncate max-w-full">{activeMentor.role}</span>
                <span className="text-outline-variant">·</span>
                <span className="truncate max-w-full text-on-surface-variant/90">{activeMentor.employer}</span>
                <span className="text-outline-variant">·</span>
                <span className="font-mono text-on-surface whitespace-nowrap">${activeMentor.rate}/hr</span>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-headline-lg-mobile sm:text-headline-lg font-bold tracking-tight text-on-surface">
                {needsExpert ? 'Book a live session' : 'Complete your booking'}
              </h1>
              <p className="mt-2 text-label-md text-on-surface-variant">
                {needsExpert
                  ? 'Choose an expert below to see pricing and continue.'
                  : 'Add your session details to continue.'}
              </p>
            </>
          )}
        </div>

        <CheckoutProgress step={step} skipPayments={skipPayments} />

        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-8 lg:gap-10 items-start">
          <div className="min-w-0">
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5 sm:p-8">
              {checkout?.clientSecret ? (
                <BookingPaymentStep
                  checkout={checkout}
                  onBack={() => setCheckout(null)}
                  sessionRole={session.role}
                />
              ) : (
                <form onSubmit={handleSubmit} method="post" className="space-y-10">
                  {assessmentPrefillNote ? (
                    <div
                      className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-label-md text-on-surface"
                      data-testid="path-assessment-booking-banner"
                    >
                      <p className="font-semibold text-on-surface">Space Path Assessment attached</p>
                      <p className="mt-1 text-on-surface-variant leading-relaxed">
                        {assessmentPrefillNote}
                      </p>
                    </div>
                  ) : null}

                  {compGrant ? (
                    <SessionCompGrantBanner grant={compGrant} showBookCta={false} />
                  ) : null}

                  {pickerVisible ? (
                    <BookingExpertPicker
                      experts={experts}
                      selectedSlug={pendingSlug}
                      invalidMentorSlug={invalidMentorSlug}
                      onSelect={handleSelectExpert}
                      onClearSelection={handleClearExpertSelection}
                    />
                  ) : null}

                  {compGrant && form.serviceType === 'session_1on1' ? (
                    <section
                      className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3"
                      data-testid="session-comp-grant-apply"
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-outline-variant"
                          checked={applyCompGrant && canApplyComp}
                          disabled={!canApplyComp}
                          data-testid="session-comp-grant-apply-checkbox"
                          onChange={(e) => setApplyCompGrant(e.target.checked)}
                        />
                        <span className="text-body-md text-on-surface">
                          <span className="font-semibold">Apply complimentary 15-minute session</span>
                          {canApplyComp ? (
                            <span className="block text-label-sm text-on-surface-variant mt-0.5">
                              Session total becomes free (no card charge).
                            </span>
                          ) : (
                            <span className="block text-label-sm text-on-surface-variant mt-0.5">
                              Set duration to 15 minutes to use your complimentary session.
                              Longer sessions are full price.
                            </span>
                          )}
                        </span>
                      </label>
                    </section>
                  ) : null}

                  {chrisCampaign ? (
                    <section>
                      <h2 className={sectionTitleClass}>Session</h2>
                      <p className={sectionHintClass}>
                        Confidential {chrisDurationMinutes}-minute live 1:1 with Chris Sembroski.
                      </p>
                    </section>
                  ) : (
                    <section>
                      <h2 className={sectionTitleClass}>Session type</h2>
                      <p className={sectionHintClass}>Choose how you want to work with an expert.</p>
                      <SessionFormatPicker
                        value={form.serviceType}
                        onChange={(serviceType) => {
                          setForm({ ...form, serviceType });
                          if (serviceType === 'session_1on1' && !activeMentor) {
                            setShowPicker(true);
                          }
                        }}
                      />
                    </section>
                  )}

                  {/* Pre-call briefing for the expert is now included by default with every live session (no extra charge or toggle). The intake below feeds the briefing generation. */}

                  <section>
                    <h2 className={sectionTitleClass}>Schedule</h2>
                    <p className={sectionHintClass}>
                      Pick a start time. Presets are Eastern (ops); the field uses your device
                      timezone.
                    </p>
                    <SessionSchedulePicker
                      value={form.scheduledAt}
                      onChange={(scheduledAt) => setForm({ ...form, scheduledAt })}
                      fieldClass={fieldClass}
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
                          : needsExpert && !activeMentor
                            ? 'Continue'
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
            mentor={activeMentor}
            form={form}
            totalCents={totalCents}
            step={step}
            checkoutAmount={checkout?.amountCents}
            onDurationChange={
              chrisCampaign ? undefined : (m) => setForm({ ...form, durationMinutes: m })
            }
            showDurationSlider={!chrisCampaign}
          />
        </div>
      </main>

      {needsExpert && step === 1 ? (
        <div
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-outline-variant bg-surface-container-lowest/95 backdrop-blur-md px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          data-testid="booking-mobile-price-bar"
        >
          {activeMentor ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-label-sm font-semibold text-on-surface truncate">
                  {activeMentor.name}
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  {form.durationMinutes} min · ${activeMentor.rate}/hr
                </p>
              </div>
              <p className="text-headline-sm font-bold text-primary tabular-nums shrink-0">
                {formatMoney(totalCents)}
              </p>
            </div>
          ) : (
            <p className="text-label-sm text-on-surface-variant text-center">
              Select an expert above to see your estimated total
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
