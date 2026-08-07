'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  PATH_ASSESSMENT_NETWORKS,
  PATH_ASSESSMENT_STAGES,
  PathAssessmentSubmitBodySchema,
  type PathAssessmentNetwork,
  type PathAssessmentStage,
} from '@/lib/path-assessment/schema';
import {
  type FieldErrors,
  fieldErrorInputClass,
  firstFieldError,
  formLevelSummary,
  toFieldErrors,
} from '@/lib/zod-field-errors';

const TOTAL_STEPS = 6;

const STEP_META: { id: number; label: string; short: string }[] = [
  { id: 1, label: 'Contact', short: 'You' },
  { id: 2, label: 'Stage', short: 'Stage' },
  { id: 3, label: 'Goal', short: 'Goal' },
  { id: 4, label: 'Background', short: 'Background' },
  { id: 5, label: 'Network', short: 'Network' },
  { id: 6, label: 'Obstacle', short: 'Obstacle' },
];

const fieldClass =
  'w-full py-3 px-4 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface)] text-[var(--landing-text)] placeholder:text-[var(--landing-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--landing-ink)] focus:ring-offset-2 transition-shadow text-[0.9375rem]';

const labelClass = 'block text-sm font-medium text-[var(--landing-text)] mb-1.5';
const hintClass = 'text-sm text-[var(--landing-muted)] mt-1.5 mb-0 leading-relaxed max-w-prose';

const choiceSelected =
  'border-[var(--landing-ink)] bg-[var(--landing-surface-soft)] text-[var(--landing-text)] shadow-[inset_0_0_0_1px_var(--landing-ink)]';
const choiceIdle =
  'border-[var(--landing-border)] bg-[var(--landing-surface)] text-[var(--landing-muted)] hover:border-[color:color-mix(in_srgb,var(--landing-border)_40%,var(--landing-muted))] hover:text-[var(--landing-text)]';

type FormState = {
  firstName: string;
  email: string;
  stage: PathAssessmentStage | '';
  primaryGoal: string;
  experience: string;
  network: PathAssessmentNetwork | '';
  obstacle: string;
  website: string;
};

const INITIAL: FormState = {
  firstName: '',
  email: '',
  stage: '',
  primaryGoal: '',
  experience: '',
  network: '',
  obstacle: '',
  website: '',
};

export function AssessmentForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const progressPct = useMemo(() => Math.round((step / TOTAL_STEPS) * 100), [step]);
  const currentMeta = STEP_META[step - 1];

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setError(null);
  };

  const validateStep = (current: number): boolean => {
    const errs: FieldErrors = {};
    if (current === 1) {
      if (!form.firstName.trim()) errs.firstName = ['Enter your first name.'];
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        errs.email = ['Enter a valid email.'];
      }
    }
    if (current === 2 && !form.stage) {
      errs.stage = ['Select your stage.'];
    }
    if (current === 3 && form.primaryGoal.trim().length < 10) {
      errs.primaryGoal = ['Add at least 10 characters about your goal.'];
    }
    if (current === 4 && form.experience.trim().length < 10) {
      errs.experience = ['Add at least 10 characters about your background.'];
    }
    if (current === 5 && !form.network) {
      errs.network = ['Select your network strength.'];
    }
    if (current === 6 && form.obstacle.trim().length < 10) {
      errs.obstacle = ['Add at least 10 characters about your obstacle.'];
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(formLevelSummary());
      return false;
    }
    setFieldErrors({});
    setError(null);
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const goBack = () => {
    setError(null);
    setFieldErrors({});
    setStep((s) => Math.max(1, s - 1));
  };

  const submit = async () => {
    if (!validateStep(TOTAL_STEPS)) return;

    const body = {
      firstName: form.firstName.trim(),
      email: form.email.trim(),
      stage: form.stage as PathAssessmentStage,
      primaryGoal: form.primaryGoal.trim(),
      experience: form.experience.trim(),
      network: form.network as PathAssessmentNetwork,
      obstacle: form.obstacle.trim(),
      website: form.website,
    };

    const parsed = PathAssessmentSubmitBodySchema.safeParse(body);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      setError(formLevelSummary());
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/path-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        fieldErrors?: FieldErrors;
        token?: string;
        status?: string;
      };

      if (!res.ok || !json.success || !json.token || json.token === 'honeypot') {
        if (json.fieldErrors) {
          setFieldErrors(json.fieldErrors);
        }
        throw new Error(json.error ?? 'Could not generate your assessment. Try again.');
      }

      router.push(`/assessment/results/${encodeURIComponent(json.token)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate your assessment. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full" data-testid="path-assessment-form">
      {/* Mobile progress */}
      <div className="mb-6 lg:hidden">
        <div className="flex items-center justify-between text-xs text-[var(--landing-muted)] mb-2">
          <span>
            Step {step} of {TOTAL_STEPS}
            {currentMeta ? ` · ${currentMeta.label}` : ''}
          </span>
          <span>{progressPct}%</span>
        </div>
        <div
          className="h-1.5 w-full rounded-full bg-[var(--landing-surface-soft)] overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Assessment progress"
        >
          <div
            className="h-full rounded-full bg-[var(--landing-ink)] transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-8 lg:gap-10 items-start">
        {/* Desktop step rail */}
        <nav
          className="hidden lg:block sticky top-8"
          aria-label="Assessment steps"
          data-testid="path-assessment-step-rail"
        >
          <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--landing-faint)] mb-4">
            Progress
          </p>
          <ol className="space-y-1">
            {STEP_META.map((s) => {
              const done = s.id < step;
              const active = s.id === step;
              return (
                <li key={s.id}>
                  <div
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? 'bg-[var(--landing-surface-soft)] text-[var(--landing-text)] font-semibold'
                        : done
                          ? 'text-[var(--landing-text)]'
                          : 'text-[var(--landing-faint)]'
                    }`}
                    aria-current={active ? 'step' : undefined}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                        active || done
                          ? 'bg-[var(--landing-ink)] text-white'
                          : 'bg-[var(--landing-surface-soft)] text-[var(--landing-faint)] border border-[var(--landing-border)]'
                      }`}
                      aria-label={done ? `${s.label}, completed` : active ? `${s.label}, current` : s.label}
                    >
                      {s.id}
                    </span>
                    <span className="leading-tight">{s.label}</span>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-6 text-xs text-[var(--landing-faint)] leading-relaxed">
            {progressPct}% complete · free report emailed when you finish
          </p>
        </nav>

        {/* Main panel */}
        <div className="min-w-0">
          {error ? (
            <div
              className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
              data-testid="path-assessment-error"
            >
              {error}
            </div>
          ) : null}

          {/* Honeypot */}
          <div className="absolute -left-[9999px] opacity-0 h-0 w-0 overflow-hidden" aria-hidden>
            <label htmlFor="path-assessment-website">Website</label>
            <input
              id="path-assessment-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => update('website', e.target.value)}
            />
          </div>

          <div className="min-h-[280px] sm:min-h-[300px]">
            {step === 1 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="font-landing-display text-xl sm:text-2xl font-semibold text-[var(--landing-text)] tracking-tight">
                    Let&apos;s personalize your report
                  </h2>
                  <p className={hintClass}>We&apos;ll email your results — no account required.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label htmlFor="firstName" className={labelClass}>
                      First name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      autoComplete="given-name"
                      className={fieldErrorInputClass(
                        !!firstFieldError(fieldErrors, 'firstName'),
                        fieldClass,
                      )}
                      value={form.firstName}
                      onChange={(e) => update('firstName', e.target.value)}
                      data-testid="path-assessment-first-name"
                    />
                    {firstFieldError(fieldErrors, 'firstName') ? (
                      <p className="mt-1.5 text-sm text-red-700">
                        {firstFieldError(fieldErrors, 'firstName')}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className={fieldErrorInputClass(
                        !!firstFieldError(fieldErrors, 'email'),
                        fieldClass,
                      )}
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      data-testid="path-assessment-email"
                    />
                    {firstFieldError(fieldErrors, 'email') ? (
                      <p className="mt-1.5 text-sm text-red-700">
                        {firstFieldError(fieldErrors, 'email')}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="font-landing-display text-xl sm:text-2xl font-semibold text-[var(--landing-text)] tracking-tight">
                    Where are you in your path?
                  </h2>
                  <p className={hintClass}>Pick the stage that fits best right now.</p>
                </div>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3"
                  role="radiogroup"
                  aria-label="Career stage"
                >
                  {PATH_ASSESSMENT_STAGES.map((stage) => {
                    const selected = form.stage === stage;
                    return (
                      <button
                        key={stage}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => update('stage', stage)}
                        className={`text-left min-h-12 touch-manipulation rounded-xl border px-4 py-3.5 text-sm font-medium transition-colors ${
                          selected ? choiceSelected : choiceIdle
                        }`}
                        data-testid={`path-assessment-stage-${stage.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {stage}
                      </button>
                    );
                  })}
                </div>
                {firstFieldError(fieldErrors, 'stage') ? (
                  <p className="text-sm text-red-700">{firstFieldError(fieldErrors, 'stage')}</p>
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <div>
                  <h2 className="font-landing-display text-xl sm:text-2xl font-semibold text-[var(--landing-text)] tracking-tight">
                    What&apos;s your primary goal in 12–24 months?
                  </h2>
                  <p className={hintClass}>
                    Be specific — roles, projects, skills, or decisions you want clarity on.
                  </p>
                </div>
                <textarea
                  id="primaryGoal"
                  rows={4}
                  className={fieldErrorInputClass(
                    !!firstFieldError(fieldErrors, 'primaryGoal'),
                    `${fieldClass} resize-y min-h-[100px]`,
                  )}
                  value={form.primaryGoal}
                  onChange={(e) => update('primaryGoal', e.target.value)}
                  placeholder="e.g. Land a flight software internship, or decide between GNC and mission ops…"
                  data-testid="path-assessment-goal"
                />
                {firstFieldError(fieldErrors, 'primaryGoal') ? (
                  <p className="text-sm text-red-700">{firstFieldError(fieldErrors, 'primaryGoal')}</p>
                ) : null}
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-4">
                <div>
                  <h2 className="font-landing-display text-xl sm:text-2xl font-semibold text-[var(--landing-text)] tracking-tight">
                    Experience, education, or projects
                  </h2>
                  <p className={hintClass}>
                    A short snapshot is enough — degrees, work, clubs, or side projects.
                  </p>
                </div>
                <textarea
                  id="experience"
                  rows={4}
                  className={fieldErrorInputClass(
                    !!firstFieldError(fieldErrors, 'experience'),
                    `${fieldClass} resize-y min-h-[100px]`,
                  )}
                  value={form.experience}
                  onChange={(e) => update('experience', e.target.value)}
                  placeholder="e.g. Junior in AE, CubeSat flight software lead, 2 internships in embedded C…"
                  data-testid="path-assessment-experience"
                />
                {firstFieldError(fieldErrors, 'experience') ? (
                  <p className="text-sm text-red-700">{firstFieldError(fieldErrors, 'experience')}</p>
                ) : null}
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="font-landing-display text-xl sm:text-2xl font-semibold text-[var(--landing-text)] tracking-tight">
                    How strong is your network in space / aerospace?
                  </h2>
                  <p className={hintClass}>
                    Honest answer — this shapes your next-step recommendations.
                  </p>
                </div>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3"
                  role="radiogroup"
                  aria-label="Network strength"
                >
                  {PATH_ASSESSMENT_NETWORKS.map((network) => {
                    const selected = form.network === network;
                    return (
                      <button
                        key={network}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => update('network', network)}
                        className={`text-left min-h-12 touch-manipulation rounded-xl border px-4 py-3.5 text-sm font-medium transition-colors ${
                          selected ? choiceSelected : choiceIdle
                        }`}
                        data-testid={`path-assessment-network-${network.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      >
                        {network}
                      </button>
                    );
                  })}
                </div>
                {firstFieldError(fieldErrors, 'network') ? (
                  <p className="text-sm text-red-700">{firstFieldError(fieldErrors, 'network')}</p>
                ) : null}
              </div>
            ) : null}

            {step === 6 ? (
              <div className="space-y-4">
                <div>
                  <h2 className="font-landing-display text-xl sm:text-2xl font-semibold text-[var(--landing-text)] tracking-tight">
                    Biggest obstacle — and what you need clarity on
                  </h2>
                  <p className={hintClass}>
                    What&apos;s blocking progress, and what would a great expert conversation unlock?
                  </p>
                </div>
                <textarea
                  id="obstacle"
                  rows={4}
                  className={fieldErrorInputClass(
                    !!firstFieldError(fieldErrors, 'obstacle'),
                    `${fieldClass} resize-y min-h-[100px]`,
                  )}
                  value={form.obstacle}
                  onChange={(e) => update('obstacle', e.target.value)}
                  placeholder="e.g. Unsure if my projects signal the right skills; need help prioritizing applications vs. deeper technical proof…"
                  data-testid="path-assessment-obstacle"
                />
                {firstFieldError(fieldErrors, 'obstacle') ? (
                  <p className="text-sm text-red-700">{firstFieldError(fieldErrors, 'obstacle')}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--landing-border)] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                disabled={submitting}
                className="inline-flex min-h-11 touch-manipulation items-center justify-center px-4 text-sm font-medium text-[var(--landing-muted)] hover:text-[var(--landing-text)] disabled:opacity-50"
                data-testid="path-assessment-back"
              >
                Back
              </button>
            ) : (
              <Link
                href="/"
                className="inline-flex min-h-11 touch-manipulation items-center justify-center px-4 text-sm font-medium text-[var(--landing-muted)] hover:text-[var(--landing-text)]"
              >
                Cancel
              </Link>
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-full bg-[var(--landing-ink)] px-8 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2 sm:min-w-[140px]"
                data-testid="path-assessment-next"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void submit()}
                disabled={submitting}
                className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-full bg-[var(--landing-ink)] px-8 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2 disabled:opacity-60 sm:min-w-[200px]"
                data-testid="path-assessment-submit"
              >
                {submitting ? 'Generating report…' : 'Get free report'}
              </button>
            )}
          </div>

          {submitting ? (
            <p
              className="mt-4 text-center text-sm text-[var(--landing-muted)]"
              data-testid="path-assessment-loading"
            >
              Building your personalized Space Path report…
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
