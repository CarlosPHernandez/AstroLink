'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getChrisBookingEntryHref } from '@/lib/chris-campaign/chris-booking-href';

type ChrisRequestSessionFormProps = {
  bookingEnabled: boolean;
  isSignedIn: boolean;
  mentorSlug: string;
  soldOut: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ChrisRequestSessionForm({
  bookingEnabled,
  isSignedIn,
  mentorSlug,
  soldOut,
}: ChrisRequestSessionFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!bookingEnabled) {
    return (
      <div className="chris-form-max w-full pt-4">
        <p className="text-sm font-light text-secondary-fixed-dim/80">
          Booking is not open yet.{' '}
          <Link
            href="/early-access?ref=chris-sembroski"
            className="text-tertiary-fixed-dim underline-offset-4 hover:underline"
          >
            Join the waitlist
          </Link>{' '}
          to get notified.
        </p>
      </div>
    );
  }

  if (soldOut) {
    return (
      <div className="chris-form-max w-full pt-4" data-testid="chris-sold-out">
        <p className="text-sm font-light text-secondary-fixed-dim/80">
          All Chris Sembroski sessions are currently reserved. Check back if a spot opens.
        </p>
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !EMAIL_PATTERN.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    router.push(getChrisBookingEntryHref(mentorSlug, isSignedIn));
  }

  return (
    <div className="chris-fade-in-up chris-delay-400 chris-form-max w-full pt-4">
      <form className="flex w-full flex-col space-y-4" onSubmit={handleSubmit}>
        <div className="relative w-full">
          <label className="sr-only" htmlFor="chris-session-email">
            Email address
          </label>
          <input
            id="chris-session-email"
            type="email"
            autoComplete="email"
            placeholder="Enter your professional email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError(null);
            }}
            className="chris-input-glow w-full border-b-2 border-outline-variant/30 bg-transparent px-2 py-3 text-sm font-light text-white placeholder:text-secondary-fixed-dim/50 transition-all duration-300 focus:border-tertiary-fixed-dim focus:outline-none"
          />
          {error ? (
            <p className="mt-2 text-xs text-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          className="chris-hover-glow relative mt-2 w-full overflow-hidden rounded-lg bg-secondary-fixed px-6 py-4 text-sm font-semibold text-tertiary-container transition-all duration-300 hover:bg-white"
          data-testid="chris-request-session"
        >
          <span className="relative z-10">Request Session</span>
          <div
            className="chris-shimmer pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
            aria-hidden="true"
          />
        </button>
        <p className="mt-3 text-center text-xs font-light text-secondary-fixed-dim/70">
          Confidential 45-minute 1-on-1 sessions.
        </p>
      </form>
    </div>
  );
}