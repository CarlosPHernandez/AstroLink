'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FieldError } from '@/components/forms/field-error';
import { FormAlert } from '@/components/forms/form-alert';
import { getEarlyAccessSuccessDisplay } from '@/lib/waitlist/early-access-success';
import { parseEarlyAccessReferrer } from '@/lib/waitlist/early-access-referrer';
import {
  trackWaitlistBadEmail,
  trackWaitlistFormStart,
  trackWaitlistFormView,
  trackWaitlistRateLimit,
  trackWaitlistSubmitAttempt,
  trackWaitlistSubmitFail,
  trackWaitlistSubmitSuccess,
  type WaitlistFormStartVia,
  type WaitlistSubmitFailReason,
} from '@/lib/waitlist/waitlist-analytics';
import type { WaitlistFormAnalytics } from '@/lib/waitlist/use-waitlist-page-analytics';
import { type FieldErrors, fieldErrorInputClass, firstFieldError } from '@/lib/zod-field-errors';

const WAITLIST_SUBMIT_ANIMATION_MS = 1200;

const fieldClass =
  'w-full min-w-0 bg-transparent border-0 border-b rounded-none px-0 py-2 text-[15px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none transition-[border-color,opacity] duration-700 ease-out motion-reduce:transition-none';

async function waitForSubmitAnimation(startedAt: number): Promise<void> {
  const remaining = WAITLIST_SUBMIT_ANIMATION_MS - (Date.now() - startedAt);
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}

type WaitlistSignupFormProps = {
  /** Used when the URL has no ?ref= (e.g. /join/[slug] partner landings). */
  defaultReferrer?: string;
  analytics: WaitlistFormAnalytics;
};

export function WaitlistSignupForm({ defaultReferrer, analytics }: WaitlistSignupFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [successDisplay, setSuccessDisplay] = useState<{
    headline: string;
    body: string;
  } | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const signupRef = useRef<HTMLDivElement>(null);
  const sentFormViewRef = useRef(false);
  const sentFormStartRef = useRef(false);

  useEffect(() => {
    if (status === 'success') {
      successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [status]);

  useEffect(() => {
    const element = signupRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || sentFormViewRef.current) return;
        sentFormViewRef.current = true;
        trackWaitlistFormView(analytics.context);
        analytics.reportFormView();
      },
      { threshold: 0.5 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [analytics.context, analytics.reportFormView]);

  function markFormStart(via: WaitlistFormStartVia) {
    if (sentFormStartRef.current) return;
    sentFormStartRef.current = true;
    trackWaitlistFormStart(analytics.context, via);
    analytics.reportFormStart(via);
  }

  function markSubmitFail(reason: WaitlistSubmitFailReason) {
    trackWaitlistSubmitFail(analytics.context, reason);
    analytics.reportSubmitFail(reason);
    if (reason === 'invalid_email_client' || reason === 'invalid_email_server') {
      trackWaitlistBadEmail(reason === 'invalid_email_client' ? 'client' : 'server');
    }
    if (reason === 'rate_limit') {
      trackWaitlistRateLimit();
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setMessage(null);

    trackWaitlistSubmitAttempt(analytics.context);
    analytics.reportSubmitAttempt();

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      markSubmitFail('invalid_email_client');
      setFieldError('Enter a valid email address.');
      return;
    }

    setStatus('loading');
    const startedAt = Date.now();

    try {
      const referrerFromUrl =
        typeof window !== 'undefined'
          ? parseEarlyAccessReferrer(window.location.search)
          : undefined;
      const referrer = referrerFromUrl ?? defaultReferrer;

      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed.toLowerCase(),
          referrer,
          company: '',
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
        fieldErrors?: FieldErrors;
      };

      if (!response.ok || !data.success) {
        setStatus('error');
        const emailError = firstFieldError(data.fieldErrors, 'email');
        if (response.status === 429) {
          markSubmitFail('rate_limit');
        } else if (emailError) {
          markSubmitFail('invalid_email_server');
        } else {
          markSubmitFail('server_error');
        }
        if (emailError) {
          setFieldError(emailError);
          setMessage(data.error ?? null);
        } else {
          setMessage(data.error ?? 'Something went wrong. Try again.');
        }
        return;
      }

      await waitForSubmitAnimation(startedAt);
      trackWaitlistSubmitSuccess(analytics.context, false);
      analytics.reportSubmitSuccess();
      setStatus('success');
      setSuccessDisplay(getEarlyAccessSuccessDisplay());
      setMessage(null);
      setEmail('');
    } catch {
      markSubmitFail('network');
      setStatus('error');
      setMessage('Check your network and try again.');
    }
  }

  return (
    <div
      ref={signupRef}
      id="signup"
      className="w-full min-w-0 scroll-mt-20 lg:max-w-[40rem]"
    >
      {status === 'success' && successDisplay ? (
        <div
          ref={successRef}
          data-testid="early-access-success"
          role="status"
          aria-live="polite"
          className="animate-waitlist-success-in motion-reduce:animate-none"
        >
          <p className="text-[15px] font-medium text-on-surface">{successDisplay.headline}</p>
          <p className="text-sm text-on-surface-variant/80 mt-1">{successDisplay.body}</p>
          <button
            type="button"
            onClick={() => {
              setStatus('idle');
              setSuccessDisplay(null);
              setMessage(null);
            }}
            className="mt-3 text-sm text-on-surface-variant/70 hover:text-on-surface cursor-pointer focus-visible:outline-none focus-visible:underline"
          >
            Add another email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="lg:max-w-[40rem]" data-testid="early-access-form">
          <p className="text-sm text-on-surface-variant/80 mb-3">
            Enter your email—we&apos;ll notify you when early access opens.
          </p>
          <div
            aria-hidden="true"
            className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
          >
            <label htmlFor="early-access-company">Company</label>
            <input
              id="early-access-company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value=""
              readOnly
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
            <div className="relative flex-1 min-w-0">
              <label htmlFor="early-access-email" className="sr-only">
                Email
              </label>
              <input
                id="early-access-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="Your email address"
                value={email}
                onFocus={() => markFormStart('focus')}
                onChange={(e) => {
                  if (e.target.value.length > 0) {
                    markFormStart('input');
                    analytics.reportHadTyped();
                  }
                  setEmail(e.target.value);
                  setFieldError(null);
                }}
                disabled={status === 'loading'}
                className={fieldErrorInputClass(
                  !!fieldError,
                  `${fieldClass} ${
                    status === 'loading'
                      ? 'border-outline-variant/40 opacity-60'
                      : 'border-outline-variant/70 focus:border-on-surface'
                  }`,
                )}
                aria-invalid={fieldError ? true : undefined}
                aria-describedby={fieldError ? 'early-access-email-error' : undefined}
              />
              {status === 'loading' ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-on-surface animate-waitlist-underline-sweep motion-reduce:scale-x-100 motion-reduce:animate-none"
                />
              ) : null}
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="shrink-0 w-full sm:w-auto text-sm font-medium text-on-surface hover:opacity-60 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity focus-visible:outline-none focus-visible:underline underline-offset-4 text-left sm:text-center py-1 sm:py-0"
            >
              {status === 'loading' ? 'Sending…' : 'Get early access'}
            </button>
          </div>

          <FieldError id="early-access-email-error" message={fieldError} />

          {status === 'error' && message && !fieldError ? <FormAlert message={message} /> : null}

          <p className="mt-3 text-xs text-on-surface-variant/60 leading-relaxed">
            One email when booking opens. Unsubscribe anytime.{' '}
            <Link
              href="/privacy"
              className="text-on-surface-variant/80 hover:text-on-surface underline decoration-on-surface-variant/30 underline-offset-2"
            >
              Privacy Policy
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}