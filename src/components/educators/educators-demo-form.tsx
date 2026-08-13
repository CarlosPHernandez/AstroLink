'use client';

import { useState, type FormEvent } from 'react';
import { EDUCATOR_ROLES } from '@/lib/educators/educator-demo-schema';
import { type FieldErrors, firstFieldError } from '@/lib/zod-field-errors';

type Status = 'idle' | 'loading' | 'success' | 'error';

const inputClass =
  'w-full min-w-0 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface)] px-3.5 py-2.5 text-sm text-[var(--landing-text)] placeholder:text-[var(--landing-faint)] focus:outline-none focus:border-[var(--landing-accent)] transition-colors disabled:opacity-60';

function labelClass(): string {
  return 'block text-xs font-semibold text-[var(--landing-muted)] mb-1.5';
}

export function EducatorsDemoForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | undefined>(undefined);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage(null);
    setFieldErrors(undefined);

    const form = event.currentTarget;
    const data = new FormData(form);
    const body = {
      fullName: String(data.get('fullName') ?? ''),
      email: String(data.get('email') ?? ''),
      schoolName: String(data.get('schoolName') ?? ''),
      role: String(data.get('role') ?? ''),
      studentPopulation: String(data.get('studentPopulation') ?? ''),
      message: String(data.get('message') ?? ''),
      referrer: typeof window !== 'undefined' ? window.location.href : undefined,
      company: String(data.get('company') ?? ''),
    };

    try {
      const response = await fetch('/api/educator-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        fieldErrors?: FieldErrors;
      };

      if (!response.ok || !result.success) {
        setStatus('error');
        setFieldErrors(result.fieldErrors);
        setMessage(result.error ?? 'Something went wrong. Try again.');
        return;
      }

      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
      setMessage('Check your network and try again.');
    }
  }

  if (status === 'success') {
    return (
      <div
        data-testid="educators-demo-success"
        role="status"
        aria-live="polite"
        className="rounded-xl border border-[var(--landing-accent)] bg-[color-mix(in_srgb,var(--landing-accent)_6%,var(--landing-surface))] p-7 sm:p-8 text-center"
      >
        <p className="font-landing-display text-lg font-bold text-[var(--landing-text)] mb-1.5">
          Request received.
        </p>
        <p className="text-sm text-[var(--landing-muted)]">
          We&apos;ll reach out within one business day to set up a time.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="educators-demo-form"
      className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-canvas)] p-6 sm:p-8 shadow-[0_20px_48px_-32px_rgba(14,20,32,0.18)]"
    >
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="educators-demo-company">Company</label>
        <input id="educators-demo-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div>
          <label htmlFor="educators-demo-fullName" className={labelClass()}>
            Your name
          </label>
          <input
            id="educators-demo-fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            disabled={status === 'loading'}
            className={inputClass}
          />
          {firstFieldError(fieldErrors, 'fullName') ? (
            <p className="mt-1.5 text-xs text-red-600">{firstFieldError(fieldErrors, 'fullName')}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="educators-demo-email" className={labelClass()}>
            Email
          </label>
          <input
            id="educators-demo-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={status === 'loading'}
            className={inputClass}
          />
          {firstFieldError(fieldErrors, 'email') ? (
            <p className="mt-1.5 text-xs text-red-600">{firstFieldError(fieldErrors, 'email')}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="educators-demo-schoolName" className={labelClass()}>
            School / program
          </label>
          <input
            id="educators-demo-schoolName"
            name="schoolName"
            type="text"
            required
            disabled={status === 'loading'}
            className={inputClass}
          />
          {firstFieldError(fieldErrors, 'schoolName') ? (
            <p className="mt-1.5 text-xs text-red-600">{firstFieldError(fieldErrors, 'schoolName')}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="educators-demo-role" className={labelClass()}>
            Your role
          </label>
          <select
            id="educators-demo-role"
            name="role"
            required
            disabled={status === 'loading'}
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              Select one
            </option>
            {EDUCATOR_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          {firstFieldError(fieldErrors, 'role') ? (
            <p className="mt-1.5 text-xs text-red-600">{firstFieldError(fieldErrors, 'role')}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="educators-demo-studentPopulation" className={labelClass()}>
            Approx. student population <span className="text-[var(--landing-faint)] font-normal">(optional)</span>
          </label>
          <input
            id="educators-demo-studentPopulation"
            name="studentPopulation"
            type="text"
            placeholder="e.g. 30 students, one AP Physics class"
            disabled={status === 'loading'}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="educators-demo-message" className={labelClass()}>
            What are you hoping to cover? <span className="text-[var(--landing-faint)] font-normal">(optional)</span>
          </label>
          <textarea
            id="educators-demo-message"
            name="message"
            rows={3}
            disabled={status === 'loading'}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {status === 'error' && message && !fieldErrors ? (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="mt-6 inline-flex min-h-12 w-full sm:w-auto touch-manipulation items-center justify-center rounded-full bg-[var(--landing-ink)] px-7 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-2"
      >
        {status === 'loading' ? 'Sending…' : 'Request a demo'}
      </button>
    </form>
  );
}
