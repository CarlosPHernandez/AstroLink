'use client';

import { useId, useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react';
import type { ZodError } from 'zod';
import { ExpertApplicationSchema, OFFERED_SERVICE_IDS } from '@/lib/expert-offer/schema';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'UTC',
] as const;

const WEEKDAYS = [
  { weekday: 0, label: 'Sunday' },
  { weekday: 1, label: 'Monday' },
  { weekday: 2, label: 'Tuesday' },
  { weekday: 3, label: 'Wednesday' },
  { weekday: 4, label: 'Thursday' },
  { weekday: 5, label: 'Friday' },
  { weekday: 6, label: 'Saturday' },
] as const;

const SERVICE_OPTIONS = [
  { id: 'session_1on1', label: 'Live 1:1' },
  { id: 'pre_call_brief', label: 'Pre-call brief' },
  { id: 'extended_session', label: 'Extended session' },
] as const;

const SUCCESS_COPY =
  'Application received. If we move forward, you will get an email to finish setup. AstroLink reviews every application before an expert appears in the directory.';

const PRICE_HELPER = 'Buyers see this rate. A shorter session is priced from the hour.';

function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

const FIELD_COPY: Record<string, string> = {
  fullName: 'Enter your name.',
  email: 'Enter a valid email.',
  employer: 'Enter your employer.',
  expertise: 'Enter your expertise.',
  bio: 'Enter a short bio.',
  hourlyRateDollars: 'Enter an hourly rate between $1 and $10,000.',
  services: 'Choose a live service or a video review.',
  timezone: 'Choose a timezone.',
  windows: 'Add at least one day you can take calls.',
  videoRequest:
    'Enter a personal video price between $25 and $500, and a delivery window of 3 to 14 days.',
};

type DayTimes = { start: string; end: string };
type FieldErrors = Record<string, string>;

const inputClass =
  'w-full min-w-0 max-w-full rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface)] px-3.5 py-2.5 text-sm text-[var(--landing-text)] placeholder:text-[var(--landing-faint)] focus:border-[var(--landing-accent)] focus:outline-none disabled:opacity-60';

function labelClass(): string {
  return 'mb-1.5 block text-xs font-semibold text-[var(--landing-muted)]';
}

function wholeNumber(raw: string): number {
  const trimmed = raw.trim();
  if (!/^[0-9]+$/.test(trimmed)) return Number.NaN;
  return Number(trimmed);
}

function timeToMinute(value: string): number {
  const match = /^(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return Number.NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}

function messagesFromIssues(error: ZodError): FieldErrors {
  const messages: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (messages[key]) continue;
    if (key === 'windows' && issue.message.includes('60 minutes')) {
      messages[key] = issue.message;
      continue;
    }
    messages[key] = FIELD_COPY[key] ?? issue.message;
  }
  return messages;
}

export function ApplyForm() {
  const formId = useId();
  const hydrated = useHydrated();
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employer, setEmployer] = useState('');
  const [expertise, setExpertise] = useState('');
  const [bio, setBio] = useState('');
  const [isCivilServant, setIsCivilServant] = useState(false);
  const [hourlyRate, setHourlyRate] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [personalVideo, setPersonalVideo] = useState(false);
  const [videoPrice, setVideoPrice] = useState('');
  const [slaDays, setSlaDays] = useState('');
  const [timezone, setTimezone] = useState<(typeof TIMEZONES)[number]>('America/New_York');
  const [days, setDays] = useState<DayTimes[]>(() => WEEKDAYS.map(() => ({ start: '', end: '' })));

  function fieldId(name: string): string {
    return `${formId}-${name}`;
  }

  function toggleService(id: (typeof OFFERED_SERVICE_IDS)[number], checked: boolean) {
    setServices((current) => {
      if (checked) return current.includes(id) ? current : [...current, id];
      return current.filter((service) => service !== id);
    });
  }

  function updateDay(weekday: number, key: keyof DayTimes, value: string) {
    setDays((current) =>
      current.map((day, index) => (index === weekday ? { ...day, [key]: value } : day)),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    let partialLabel: string | null = null;
    const windows: { weekday: number; startMinute: number; endMinute: number }[] = [];
    days.forEach((day, weekday) => {
      const start = day.start.trim();
      const end = day.end.trim();
      if (!start && !end) return;
      if (!start || !end) {
        partialLabel ??= WEEKDAYS[weekday]?.label ?? 'that day';
        return;
      }
      windows.push({
        weekday,
        startMinute: timeToMinute(start),
        endMinute: timeToMinute(end),
      });
    });

    const candidate = {
      fullName,
      email,
      employer,
      expertise,
      bio,
      isCivilServant,
      hourlyRateDollars: wholeNumber(hourlyRate),
      services,
      videoRequest: personalVideo
        ? {
            enabled: true as const,
            priceCents: wholeNumber(videoPrice) * 100,
            slaDays: wholeNumber(slaDays),
          }
        : { enabled: false as const },
      timezone,
      windows,
    };

    const parsed = ExpertApplicationSchema.safeParse(candidate);
    const nextErrors = parsed.success ? {} : messagesFromIssues(parsed.error);
    if (fullName.trim() === '') nextErrors.fullName = 'Enter your name.';
    if (partialLabel) {
      nextErrors.windows = `Enter both a start and an end for ${partialLabel}.`;
    }

    if (fullName.trim() === '' || partialLabel || !parsed.success) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const response = await fetch('/api/expert-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const result = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if ((response.status === 200 || response.status === 201) && result?.success) {
        setSucceeded(true);
        return;
      }

      setFormError(result?.error ?? 'Could not submit. Try again.');
    } catch {
      setFormError('Check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (succeeded) {
    return (
      <p role="status" data-testid="expert-apply-success" className="text-base leading-relaxed text-[var(--landing-text)]">
        {SUCCESS_COPY}
      </p>
    );
  }

  const priceDescribedBy = [
    fieldErrors.hourlyRateDollars ? fieldId('hourlyRate-error') : null,
    fieldId('hourlyRate-help'),
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      data-testid="expert-apply-form"
      data-hydrated={hydrated ? 'true' : 'false'}
      className="flex flex-col gap-5"
    >
      <Field
        id={fieldId('fullName')}
        label="Full name"
        error={fieldErrors.fullName}
        errorId={fieldId('fullName-error')}
      >
        <input
          id={fieldId('fullName')}
          name="fullName"
          type="text"
          autoComplete="name"
          value={fullName}
          disabled={submitting}
          aria-invalid={fieldErrors.fullName ? true : undefined}
          aria-describedby={fieldErrors.fullName ? fieldId('fullName-error') : undefined}
          onChange={(event) => setFullName(event.target.value)}
          className={inputClass}
        />
      </Field>

      <Field
        id={fieldId('email')}
        label="Email"
        error={fieldErrors.email}
        errorId={fieldId('email-error')}
      >
        <input
          id={fieldId('email')}
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          disabled={submitting}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? fieldId('email-error') : undefined}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </Field>

      <Field
        id={fieldId('employer')}
        label="Employer"
        error={fieldErrors.employer}
        errorId={fieldId('employer-error')}
      >
        <input
          id={fieldId('employer')}
          name="employer"
          type="text"
          autoComplete="organization"
          value={employer}
          disabled={submitting}
          aria-invalid={fieldErrors.employer ? true : undefined}
          aria-describedby={fieldErrors.employer ? fieldId('employer-error') : undefined}
          onChange={(event) => setEmployer(event.target.value)}
          className={inputClass}
        />
      </Field>

      <Field
        id={fieldId('expertise')}
        label="Expertise"
        error={fieldErrors.expertise}
        errorId={fieldId('expertise-error')}
      >
        <input
          id={fieldId('expertise')}
          name="expertise"
          type="text"
          value={expertise}
          disabled={submitting}
          aria-invalid={fieldErrors.expertise ? true : undefined}
          aria-describedby={fieldErrors.expertise ? fieldId('expertise-error') : undefined}
          onChange={(event) => setExpertise(event.target.value)}
          className={inputClass}
        />
      </Field>

      <Field id={fieldId('bio')} label="Bio" error={fieldErrors.bio} errorId={fieldId('bio-error')}>
        <textarea
          id={fieldId('bio')}
          name="bio"
          rows={5}
          value={bio}
          disabled={submitting}
          aria-invalid={fieldErrors.bio ? true : undefined}
          aria-describedby={fieldErrors.bio ? fieldId('bio-error') : undefined}
          onChange={(event) => setBio(event.target.value)}
          className={inputClass}
        />
      </Field>

      <label className="flex items-start gap-2.5 text-sm text-[var(--landing-text)]">
        <input
          type="checkbox"
          name="isCivilServant"
          checked={isCivilServant}
          disabled={submitting}
          onChange={(event) => setIsCivilServant(event.target.checked)}
          className="mt-0.5 accent-[var(--landing-ink)]"
        />
        I am a federal civil servant
      </label>

      <Field
        id={fieldId('hourlyRate')}
        label="Hourly rate (USD)"
        error={fieldErrors.hourlyRateDollars}
        errorId={fieldId('hourlyRate-error')}
      >
        <input
          id={fieldId('hourlyRate')}
          name="hourlyRateDollars"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={hourlyRate}
          disabled={submitting}
          aria-invalid={fieldErrors.hourlyRateDollars ? true : undefined}
          aria-describedby={priceDescribedBy}
          onChange={(event) => setHourlyRate(event.target.value)}
          className={inputClass}
        />
        <p id={fieldId('hourlyRate-help')} className="mt-1.5 text-xs leading-relaxed text-[var(--landing-muted)]">
          {PRICE_HELPER}
        </p>
      </Field>

      <fieldset className="min-w-0 space-y-2.5" aria-describedby={fieldErrors.services ? fieldId('services-error') : undefined}>
        <legend className={labelClass()}>Services</legend>
        {SERVICE_OPTIONS.map((service) => (
          <label key={service.id} className="flex items-start gap-2.5 text-sm text-[var(--landing-text)]">
            <input
              type="checkbox"
              name="services"
              value={service.id}
              checked={services.includes(service.id)}
              disabled={submitting}
              onChange={(event) => toggleService(service.id, event.target.checked)}
              className="mt-0.5 accent-[var(--landing-ink)]"
            />
            {service.label}
          </label>
        ))}
        <label className="flex items-start gap-2.5 text-sm text-[var(--landing-text)]">
          <input
            type="checkbox"
            name="personalVideo"
            checked={personalVideo}
            disabled={submitting}
            onChange={(event) => setPersonalVideo(event.target.checked)}
            className="mt-0.5 accent-[var(--landing-ink)]"
          />
          Personal video
        </label>
        {fieldErrors.services ? <FieldError id={fieldId('services-error')} message={fieldErrors.services} /> : null}
      </fieldset>

      {personalVideo ? (
        <div className="flex flex-col gap-5">
          <Field
            id={fieldId('videoPrice')}
            label="Personal video price (USD)"
            error={fieldErrors.videoRequest}
            errorId={fieldId('video-error')}
          >
            <input
              id={fieldId('videoPrice')}
              name="videoPriceDollars"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={videoPrice}
              disabled={submitting}
              aria-invalid={fieldErrors.videoRequest ? true : undefined}
              aria-describedby={fieldErrors.videoRequest ? fieldId('video-error') : undefined}
              onChange={(event) => setVideoPrice(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field id={fieldId('slaDays')} label="Days to deliver" error={undefined} errorId={fieldId('video-error')}>
            <input
              id={fieldId('slaDays')}
              name="slaDays"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={slaDays}
              disabled={submitting}
              aria-invalid={fieldErrors.videoRequest ? true : undefined}
              aria-describedby={fieldErrors.videoRequest ? fieldId('video-error') : undefined}
              onChange={(event) => setSlaDays(event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      ) : null}

      <Field
        id={fieldId('timezone')}
        label="Timezone"
        error={fieldErrors.timezone}
        errorId={fieldId('timezone-error')}
      >
        <select
          id={fieldId('timezone')}
          name="timezone"
          value={timezone}
          disabled={submitting}
          aria-invalid={fieldErrors.timezone ? true : undefined}
          aria-describedby={fieldErrors.timezone ? fieldId('timezone-error') : undefined}
          onChange={(event) => setTimezone(event.target.value as (typeof TIMEZONES)[number])}
          className={inputClass}
        >
          {TIMEZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </Field>

      <fieldset className="min-w-0 space-y-4" aria-describedby={fieldErrors.windows ? fieldId('windows-error') : undefined}>
        <legend className={labelClass()}>Hours</legend>
        {WEEKDAYS.map((day) => (
          <fieldset key={day.weekday} aria-label={day.label} className="min-w-0">
            <legend className="mb-1.5 text-sm font-semibold text-[var(--landing-text)]">{day.label}</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="min-w-0 text-xs text-[var(--landing-muted)]">
                Start
                <input
                  type="time"
                  value={days[day.weekday]?.start ?? ''}
                  disabled={submitting}
                  onChange={(event) => updateDay(day.weekday, 'start', event.target.value)}
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="min-w-0 text-xs text-[var(--landing-muted)]">
                End
                <input
                  type="time"
                  value={days[day.weekday]?.end ?? ''}
                  disabled={submitting}
                  onChange={(event) => updateDay(day.weekday, 'end', event.target.value)}
                  className={`${inputClass} mt-1`}
                />
              </label>
            </div>
          </fieldset>
        ))}
        {fieldErrors.windows ? <FieldError id={fieldId('windows-error')} message={fieldErrors.windows} /> : null}
      </fieldset>

      {formError ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-12 w-full touch-manipulation items-center justify-center rounded-full bg-[var(--landing-ink)] px-6 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  errorId,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  errorId: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={labelClass()}>
        {label}
      </label>
      {children}
      {error ? <FieldError id={errorId} message={error} /> : null}
    </div>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-[var(--color-error)]">
      {message}
    </p>
  );
}
