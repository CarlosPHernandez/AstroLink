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

const fieldClass =
  'w-full py-3 px-4 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface)] text-[var(--landing-text)] placeholder:text-[var(--landing-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--landing-ink)] focus:ring-offset-2 transition-shadow';

const labelClass = 'block text-sm font-medium text-[var(--landing-text)] mb-2';
const hintClass = 'text-sm text-[var(--landing-muted)] mb-3 leading-relaxed';

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

function stepFields(step: number): (keyof FormState)[] {
  switch (step) {
    case 1:
      return ['firstName', 'email'];
    case 2:
      return ['stage'];
    case 3:
      return ['primaryGoal'];
    case 4:
      return ['experience'];
    case 5:
      return ['network'];
    case 6:
      return ['obstacle'];
    default:
      return [];
  }
}

export function AssessmentForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const progressPct = useMemo(() => Math.round((step / TOTAL_STEPS) * 100), [step]);

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
    const payload = {
      firstName: form.firstName,
      email: form.email,
      stage: form.stage || undefined,
      primaryGoal: form.primaryGoal,
      experience: form.experience,
      network: form.network || undefined,
      obstacle: form.obstacle,
      website: form.website,
    };

    // Full schema only on last step; per-step use partial checks via full parse + filter
    const parsed = PathAssessmentSubmitBodySchema.safeParse({
      firstName: form.firstName.trim() || 'x',
      email: form.email.trim() || 'placeholder@example.com',
      stage: form.stage || PATH_ASSESSMENT_STAGES[0],
      primaryGoal: form.primaryGoal.trim() || 'placeholder goal text here',
      experience: form.experience.trim() || 'placeholder experience text',
      network: form.network || PATH_ASSESSMENT_NETWORKS[0],
      obstacle: form.obstacle.trim() || 'placeholder obstacle text',
      website: form.website,
    });

    // Manual step validation for better UX
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

    // silence unused
    void parsed;
    void payload;

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
    <div className="w-full max-w-lg mx-auto" data-testid="path-assessment-form">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between text-xs text-[var(--landing-muted)] mb-2">
          <span>
            Step {step} of {TOTAL_STEPS}
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

      <div className="space-y-5">
        {step === 1 ? (
          <>
            <div>
              <h2 className="font-landing-display text-xl sm:text-2xl font-semibold text-[var(--landing-text)] tracking-tight">
                Let&apos;s personalize your report
              </h2>
              <p className={hintClass}>We&apos;ll email your results — no account required.</p>
            </div>
            <div>
              <label htmlFor="firstName" className={labelClass}>
                First name
              </label>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                className={fieldErrorInputClass(!!firstFieldError(fieldErrors, 'firstName'), fieldClass)}
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                data-testid="path-assessment-first-name"
              />
              {firstFieldError(fieldErrors, 'firstName') ? (
                <p className="mt-1.5 text-sm text-red-700">{firstFieldError(fieldErrors, 'firstName')}</p>
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
                className={fieldErrorInputClass(!!firstFieldError(fieldErrors, 'email'), fieldClass)}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                data-testid="path-assessment-email"
              />
              {firstFieldError(fieldErrors, 'email') ? (
                <p className="mt-1.5 text-sm text-red-700">{firstFieldError(fieldErrors, 'email')}</p>
              ) : null}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div>
              <h2 className="font-landing-display text-xl sm:text-2xl font-semibold text-[var(--landing-text)] tracking-tight">
                Where are you in your path?
              </h2>
              <p className={hintClass}>Pick the stage that fits best right now.</p>
            </div>
            <div className="grid gap-2" role="radiogroup" aria-label="Career stage">
              {PATH_ASSESSMENT_STAGES.map((stage) => {
                const selected = form.stage === stage;
                return (
                  <button
                    key={stage}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => update('stage', stage)}
                    className={`text-left min-h-12 touch-manipulation rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      selected
                        ? 'border-[var(--landing-ink)] bg-[var(--landing-surface-soft)] text-[var(--landing-text)]'
                        : 'border-[var(--landing-border)] bg-[var(--landing-surface)] text-[var(--landing-muted)] hover:border-[color:color-mix(in_srgb,var(--landing-border)_50%,var(--landing-muted))]'
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
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div>
              <h2 className="font-landing-display text-xl sm:text-2xl font-semibold text-[var(--landing-text)] tracking-tight">
                What&apos;s your primary goal in 12–24 months?
              </h2>
              <p className={hintClass}>Be specific — roles, projects, skills, or decisions you want clarity on.</p>
            </div>
            <textarea
              id="primaryGoal"
              rows={5}
              className={fieldErrorInputClass(
                !!firstFieldError(fieldErrors, 'primaryGoal'),
                `${fieldClass} resize-y min-h-[120px]`,
              )}
              value={form.primaryGoal}
              onChange={(e) => update('primaryGoal', e.target.value)}
              placeholder="e.g. Land a flight software internship, or decide between GNC and mission ops…"
              data-testid="path-assessment-goal"
            />
            {firstFieldError(fieldErrors, 'primaryGoal') ? (
              <p className="text-sm text-red-700">{firstFieldError(fieldErrors, 'primaryGoal')}</p>
            ) : null}
          </>
        ) : null}

        {step === 4 ? (
          <>
            <div>
              <h2 className="font-landing-display text-xl sm:text-2xl font-semibold text-[var(--landing-text)] tracking-tight">
                Experience, education, or projects
              </h2>
              <p className={hintClass}>A short snapshot is enough — degrees, work, clubs, or side projects.</p>
            </div>
            <textarea
              id="experience"
              rows={5}
              className={fieldErrorInputClass(
                !!firstFieldError(fieldErrors, 'experience'),
                `${fieldClass} resize-y min-h-[120px]`,
              )}
              value={form.experience}
              onChange={(e) => update('experience', e.target.value)}
              placeholder="e.g. Junior in AE, CubeSat flight software lead, 2 internships in embedded C…"
              data-testid="path-assessment-experience"
            />
            {firstFieldError(fieldErrors, 'experience') ? (
              <p className="text-sm text-red-700">{firstFieldError(fieldErrors, 'experience')}</p>
            ) : null}
          </>
        ) : null}

        {step === 5 ? (
          <>
            <div>
              <h2 className="font-landing-display text-xl sm:text-2xl font-semibold text-[var(--landing-text)] tracking-tight">
                How strong is your network in space / aerospace?
              </h2>
              <p className={hintClass}>Honest answer — this shapes your next-step recommendations.</p>
            </div>
            <div className="grid gap-2" role="radiogroup" aria-label="Network strength">
              {PATH_ASSESSMENT_NETWORKS.map((network) => {
                const selected = form.network === network;
                return (
                  <button
                    key={network}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => update('network', network)}
                    className={`text-left min-h-12 touch-manipulation rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      selected
                        ? 'border-[var(--landing-ink)] bg-[var(--landing-surface-soft)] text-[var(--landing-text)]'
                        : 'border-[var(--landing-border)] bg-[var(--landing-surface)] text-[var(--landing-muted)] hover:border-[color:color-mix(in_srgb,var(--landing-border)_50%,var(--landing-muted))]'
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
          </>
        ) : null}

        {step === 6 ? (
          <>
            <div>
              <h2 className="font-landing-display text-xl sm:text-2xl font-semibold text-[var(--landing-text)] tracking-tight">
                Biggest obstacle — and what you need clarity on
              </h2>
              <p className={hintClass}>What&apos;s blocking progress, and what would a great expert conversation unlock?</p>
            </div>
            <textarea
              id="obstacle"
              rows={5}
              className={fieldErrorInputClass(
                !!firstFieldError(fieldErrors, 'obstacle'),
                `${fieldClass} resize-y min-h-[120px]`,
              )}
              value={form.obstacle}
              onChange={(e) => update('obstacle', e.target.value)}
              placeholder="e.g. Unsure if my projects signal the right skills; need help prioritizing applications vs. deeper technical proof…"
              data-testid="path-assessment-obstacle"
            />
            {firstFieldError(fieldErrors, 'obstacle') ? (
              <p className="text-sm text-red-700">{firstFieldError(fieldErrors, 'obstacle')}</p>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
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
            className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-full bg-[var(--landing-ink)] px-6 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2"
            data-testid="path-assessment-next"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-full bg-[var(--landing-ink)] px-6 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2 disabled:opacity-60"
            data-testid="path-assessment-submit"
          >
            {submitting ? 'Generating your report…' : 'Get my free assessment'}
          </button>
        )}
      </div>

      {submitting ? (
        <p className="mt-4 text-center text-sm text-[var(--landing-muted)]" data-testid="path-assessment-loading">
          Building your personalized Space Path report…
        </p>
      ) : null}

      {/* Keep stepFields referenced for future field-level focus */}
      <span className="hidden" aria-hidden>
        {stepFields(step).join(',')}
      </span>
    </div>
  );
}
