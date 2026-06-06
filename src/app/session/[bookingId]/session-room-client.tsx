'use client';

import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { BookingSessionView } from '@/lib/booking-access';
import type { MentorBriefingOutput, PostSessionOutput } from '@/lib/types';
import { formatSessionWhen } from '@/lib/format';
import {
  getMediaOriginSnapshot,
  MEDIA_ORIGIN_SERVER_SNAPSHOT,
  subscribeMediaOrigin,
} from '@/lib/media-origin';

const PROVISION_POLL_MS = 5000;
const PROVISION_TIMEOUT_MS = 120_000;

function isSessionBriefing(
  briefing: BookingSessionView['briefing'],
): briefing is MentorBriefingOutput {
  return briefing !== null && 'session_objectives' in briefing;
}

type SessionRecapResponse = {
  ready: boolean;
  recap: PostSessionOutput | null;
  transcriptAvailable: boolean;
};

function SessionRecapPanel({ bookingId }: { bookingId: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'pending' | 'error'>('loading');
  const [recap, setRecap] = useState<PostSessionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRecap() {
      try {
        const res = await fetch(`/api/session/${bookingId}/recap`);
        const data = (await res.json()) as SessionRecapResponse & { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? 'Could not load recap');
        }
        if (cancelled) {
          return;
        }
        if (data.ready && data.recap) {
          setRecap(data.recap);
          setState('ready');
          return;
        }
        setState('pending');
      } catch (err: unknown) {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Could not load recap');
        setState('error');
      }
    }

    void loadRecap();
    const id = window.setInterval(() => {
      void loadRecap();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [bookingId]);

  if (state === 'loading' || state === 'pending') {
    return (
      <p className="text-body-md text-on-surface-variant mb-6" data-testid="session-recap-pending">
        {state === 'loading' ? 'Loading your recap…' : 'Recap is still generating. This refreshes automatically.'}
      </p>
    );
  }

  if (state === 'error' || !recap) {
    return (
      <p className="text-body-md text-on-surface-variant mb-6" data-testid="session-recap-error">
        {error ?? 'Recap is not available yet. Check your dashboard in a minute.'}
      </p>
    );
  }

  return (
    <div className="w-full text-left space-y-4 mb-6" data-testid="session-recap-content">
      <p className="text-body-md text-on-surface">{recap.session_summary}</p>
      {recap.key_insights.length > 0 && (
        <div>
          <h4 className="text-label-sm font-semibold text-on-surface mb-2">Key insights</h4>
          <ul className="space-y-1 text-body-md text-on-surface-variant">
            {recap.key_insights.map((insight) => (
              <li key={insight}>• {insight}</li>
            ))}
          </ul>
        </div>
      )}
      {recap.action_items.length > 0 && (
        <div>
          <h4 className="text-label-sm font-semibold text-on-surface mb-2">Action items</h4>
          <ul className="space-y-2 text-body-md text-on-surface-variant">
            {recap.action_items.map((item) => (
              <li key={`${item.task}-${item.owner}`}>
                <span className="text-on-surface">{item.task}</span>
                <span className="block text-label-sm">
                  {item.owner} · {item.deadline}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function dashboardHref(role: BookingSessionView['sessionRole']): string {
  if (role === 'mentor') {
    return '/dashboard/mentor';
  }
  return '/dashboard/mentee';
}

/** Centered gate card — w-full prevents flex-shrink from crushing text to one word per line. */
function SessionGatePanel({
  testId,
  children,
}: {
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-testid={testId}
      className="w-full max-w-[var(--max-width-content)] mx-auto rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-sm sm:p-8"
    >
      {children}
    </div>
  );
}

export default function SessionRoomClient({ booking }: { booking: BookingSessionView }) {
  const [ended, setEnded] = useState(false);
  const [provisioningStartedAt] = useState(() => Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);
  const [provisionLoading, setProvisionLoading] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const { insecure: insecureMediaOrigin, httpsOrigin: httpsDevOrigin } = useSyncExternalStore(
    subscribeMediaOrigin,
    getMediaOriginSnapshot,
    () => MEDIA_ORIGIN_SERVER_SNAPSHOT,
  );

  const exitHref = dashboardHref(booking.sessionRole);

  useEffect(() => {
    if (booking.gate !== 'provisioning') {
      return;
    }
    const tick = () => setElapsedMs(Date.now() - provisioningStartedAt);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [booking.gate, provisioningStartedAt]);

  useEffect(() => {
    if (booking.gate !== 'provisioning') {
      return;
    }
    const id = window.setInterval(() => {
      window.location.reload();
    }, PROVISION_POLL_MS);
    return () => window.clearInterval(id);
  }, [booking.gate]);

  const retryProvision = useCallback(async () => {
    setProvisionLoading(true);
    setProvisionError(null);
    try {
      const res = await fetch('/api/session/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Room setup failed');
      }
      window.location.reload();
    } catch (err: unknown) {
      setProvisionError(err instanceof Error ? err.message : 'Room setup failed');
    } finally {
      setProvisionLoading(false);
    }
  }, [booking.id]);

  const provisioningTimedOut = booking.gate === 'provisioning' && elapsedMs >= PROVISION_TIMEOUT_MS;

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <header className="border-b border-outline-variant bg-surface-container-lowest px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={exitHref}
            data-testid="session-exit"
            className="text-on-surface-variant hover:text-on-surface text-label-sm"
          >
            ← Exit call
          </Link>
          <span className="text-outline-variant">|</span>
          <span data-testid="session-mentor-name" className="font-bold text-on-surface tracking-tight">
            Session with {booking.mentorName}
          </span>
        </div>
        <span
          data-testid="session-status-badge"
          className="text-label-sm font-mono text-on-surface-variant uppercase"
        >
          {booking.status}
        </span>
      </header>

      <div className="flex flex-1 flex-col min-h-0 lg:flex-row">
        <div className="flex min-h-[min(24rem,60vh)] min-w-0 flex-1 flex-col border-outline-variant bg-surface-container lg:border-r">
          <div className="flex flex-1 w-full flex-col items-center justify-center px-4 py-8 sm:px-8">
          {insecureMediaOrigin && (
            <div
              data-testid="session-insecure-origin-warning"
              className="mb-4 w-full max-w-4xl rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-body-md text-on-surface"
            >
              Camera and microphone are blocked over plain HTTP on this address. On your Mac,{' '}
              <a href="http://localhost:3000" className="font-semibold text-primary underline">
                http://localhost:3000
              </a>{' '}
              works. For an iPhone or another device on your Wi‑Fi, stop the server and run{' '}
              <code className="font-mono text-label-sm">npm run dev:lan</code>, then open{' '}
              <a href={httpsDevOrigin} className="font-semibold text-primary underline">
                {httpsDevOrigin}
              </a>{' '}
              and accept Safari&apos;s certificate warning.
            </div>
          )}
          {booking.gate === 'pending_payment' && (
            <SessionGatePanel testId="session-pending-payment">
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Payment required</h3>
              <p className="text-body-md text-on-surface-variant mb-6">
                Complete payment from your dashboard before joining the video room.
              </p>
              <Link
                href={exitHref}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-label-sm font-semibold text-on-primary hover:bg-primary-container"
              >
                Back to dashboard
              </Link>
            </SessionGatePanel>
          )}

          {booking.gate === 'too_early' && (
            <SessionGatePanel testId="session-too-early">
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Not open yet</h3>
              <p className="text-body-md text-on-surface-variant mb-6 text-pretty">
                The video room opens shortly before your scheduled session (
                <span suppressHydrationWarning>{formatSessionWhen(booking.scheduledAt)}</span>
                ). Check back a few minutes before start time.
              </p>
              <Link
                href={exitHref}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-5 py-2.5 text-label-sm font-semibold text-on-primary hover:bg-primary-container sm:w-auto"
              >
                Back to dashboard
              </Link>
            </SessionGatePanel>
          )}

          {booking.gate === 'expired' && (
            <SessionGatePanel testId="session-expired">
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Join window closed</h3>
              <p className="text-body-md text-on-surface-variant mb-6 text-pretty">
                The scheduled join window for this session has ended. If you still need help, contact
                support or book another session from your dashboard.
              </p>
              <Link
                href={exitHref}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-label-sm font-semibold text-on-primary hover:bg-primary-container"
              >
                Back to dashboard
              </Link>
            </SessionGatePanel>
          )}

          {booking.gate === 'provisioning' && (
            <SessionGatePanel testId="session-provisioning">
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Room preparing</h3>
              <p className="text-body-md text-on-surface-variant mb-4">
                Your private video room is being set up. This page refreshes automatically every few
                seconds.
              </p>
              {provisioningTimedOut ? (
                <>
                  <p className="text-body-md text-error mb-4" data-testid="session-provision-timeout">
                    Setup is taking longer than expected. Try again or return to your dashboard.
                  </p>
                  <button
                    type="button"
                    data-testid="session-provision-retry"
                    disabled={provisionLoading}
                    onClick={() => void retryProvision()}
                    className="inline-block px-5 py-2.5 rounded-md bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container disabled:opacity-50 mr-3"
                  >
                    {provisionLoading ? 'Setting up…' : 'Retry room setup'}
                  </button>
                </>
              ) : (
                <p className="text-label-sm text-on-surface-variant animate-pulse">Preparing room…</p>
              )}
              {provisionError && (
                <p className="text-label-sm text-error mt-3" data-testid="session-provision-error">
                  {provisionError}
                </p>
              )}
            </SessionGatePanel>
          )}

          {booking.gate === 'ready' && !ended && booking.dailyJoinUrl && !booking.tokenError && (
            <div
              data-testid="session-join-ready"
              className="mx-auto w-full max-w-4xl overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm aspect-video"
            >
              <iframe
                data-testid="session-daily-iframe"
                src={booking.dailyJoinUrl}
                allow="camera; microphone; fullscreen; display-capture"
                className="w-full h-full min-h-[360px]"
                title="AstroLink video session"
              />
              <div className="p-4 bg-surface-container-lowest border-t border-outline-variant flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-label-sm text-on-surface-variant">
                  Leave the call in the video panel above to finish billing. The button below only
                  hides the video on this page.
                </p>
                <button
                  type="button"
                  data-testid="session-end-local"
                  onClick={() => setEnded(true)}
                  className="px-6 py-2 rounded-md bg-error text-on-error text-label-sm font-semibold hover:opacity-90 shrink-0"
                >
                  End session
                </button>
              </div>
            </div>
          )}

          {booking.gate === 'ready' && !ended && booking.tokenError && (
            <SessionGatePanel testId="session-token-error">
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Could not join room</h3>
              <p className="text-body-md text-on-surface-variant mb-6">{booking.tokenError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-label-sm font-semibold text-on-primary hover:bg-primary-container"
              >
                Try again
              </button>
            </SessionGatePanel>
          )}

          {booking.gate === 'ready' && !ended && !booking.dailyJoinUrl && !booking.tokenError && (
            <SessionGatePanel testId="session-no-join-url">
              <p className="text-body-md text-on-surface-variant mb-6 text-pretty">
                Video is unavailable — Daily is not configured for this environment.
              </p>
              <Link
                href={exitHref}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-label-sm font-semibold text-on-primary hover:bg-primary-container"
              >
                Back to dashboard
              </Link>
            </SessionGatePanel>
          )}

          {booking.gate === 'completed' && (
            <SessionGatePanel testId="session-completed">
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Session completed</h3>
              <SessionRecapPanel bookingId={booking.id} />
              <Link
                href={exitHref}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-label-sm font-semibold text-on-primary hover:bg-primary-container"
              >
                Back to dashboard
              </Link>
            </SessionGatePanel>
          )}

          {(booking.gate === 'payment_failed' || booking.gate === 'unavailable') && (
            <SessionGatePanel testId="session-unavailable">
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Session unavailable</h3>
              <p className="text-body-md text-on-surface-variant mb-6">
                This booking cannot be joined right now ({booking.status}).
              </p>
              <Link
                href={exitHref}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-label-sm font-semibold text-on-primary hover:bg-primary-container"
              >
                Back to dashboard
              </Link>
            </SessionGatePanel>
          )}

          {booking.gate === 'ready' && ended && (
            <SessionGatePanel testId="session-ended-local">
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Session ended</h3>
              <p className="text-body-md text-on-surface-variant mb-6 text-pretty">
                Post-session synthesis and payment capture run when everyone leaves the Daily call
                (webhook). Check your dashboard in a minute for the summary.
              </p>
              <Link
                href={exitHref}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-label-sm font-semibold text-on-primary hover:bg-primary-container"
              >
                Back to dashboard
              </Link>
            </SessionGatePanel>
          )}
          </div>
        </div>

        <aside className="w-full shrink-0 p-6 space-y-6 border-outline-variant bg-surface-container-lowest lg:w-96">
          <div>
            <h3 className="text-headline-md font-bold text-on-surface">Session briefing</h3>
            <p className="text-label-sm text-on-surface-variant mt-1">
              <span suppressHydrationWarning>{formatSessionWhen(booking.scheduledAt)}</span>
            </p>
          </div>
          {isSessionBriefing(booking.briefing) ? (
            <ul className="space-y-2 text-body-md text-on-surface-variant">
              {booking.briefing.session_objectives.map((obj) => (
                <li key={obj}>• {obj}</li>
              ))}
            </ul>
          ) : (
            <p className="text-on-surface-variant text-body-md">Briefing not available for this booking.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
