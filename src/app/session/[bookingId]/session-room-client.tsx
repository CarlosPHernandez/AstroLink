'use client';

import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { DailyCallRoom } from '@/components/session/daily-call-room';
import { SessionTranscriptPanel } from '@/components/session/session-transcript-panel';
import type { BookingSessionView } from '@/lib/booking-access';
import { getDashboardPathForRole } from '@/lib/dashboard-paths';
import { isSessionBriefing, resolveSessionObjectives } from '@/lib/briefing-display';
import type { PostSessionOutput } from '@/lib/types';
import { firstDisplayName } from '@/lib/display-name';
import { formatSessionWhen } from '@/lib/format';
import {
  getMediaOriginSnapshot,
  MEDIA_ORIGIN_SERVER_SNAPSHOT,
  subscribeMediaOrigin,
} from '@/lib/media-origin';

const PROVISION_POLL_MS = 5000;
const PROVISION_TIMEOUT_MS = 120_000;

type SessionRecapResponse = {
  ready: boolean;
  recap: PostSessionOutput | null;
  transcriptAvailable: boolean;
  locale?: string;
  localized?: boolean;
  translationPending?: boolean;
  translationFailed?: boolean;
};

function SessionRecapPanel({ bookingId }: { bookingId: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'pending' | 'error'>('loading');
  const [recap, setRecap] = useState<PostSessionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [translationPending, setTranslationPending] = useState(false);
  const [translationFailed, setTranslationFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pollId: number | null = null;

    function stopPolling() {
      if (pollId !== null) {
        window.clearInterval(pollId);
        pollId = null;
      }
    }

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
        setTranslationPending(Boolean(data.translationPending));
        setTranslationFailed(Boolean(data.translationFailed));

        if (data.ready && data.recap) {
          setRecap(data.recap);
          setState('ready');
          if (!data.translationPending) {
            stopPolling();
          }
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
    pollId = window.setInterval(() => {
      void loadRecap();
    }, 5000);

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [bookingId]);

  if (state === 'loading' || state === 'pending') {
    const pendingMessage =
      state === 'loading'
        ? 'Loading your recap…'
        : translationPending
          ? 'Translating recap… This refreshes automatically.'
          : 'Recap is still generating. This refreshes automatically.';

    return (
      <p className="text-body-md text-on-surface-variant mb-6" data-testid="session-recap-pending">
        {pendingMessage}
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
      {translationFailed ? (
        <p
          className="text-label-sm text-on-surface-variant mb-2"
          data-testid="session-recap-translation-failed"
        >
          Translation unavailable — showing English recap.
        </p>
      ) : null}
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
  const [fulfillment, setFulfillment] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [bookingStatus, setBookingStatus] = useState(booking.status);
  const [provisioningStartedAt] = useState(() => Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);
  const [provisionLoading, setProvisionLoading] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const { insecure: insecureMediaOrigin, httpsOrigin: httpsDevOrigin } = useSyncExternalStore(
    subscribeMediaOrigin,
    getMediaOriginSnapshot,
    () => MEDIA_ORIGIN_SERVER_SNAPSHOT,
  );

  const exitHref = getDashboardPathForRole(booking.sessionRole);
  const isCompleted =
    booking.gate === 'completed' || bookingStatus === 'completed' || fulfillment === 'done';
  const showPostSessionUi = isCompleted || (ended && fulfillment !== 'idle');

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

  /** Webhook fallback: complete booking + kick APX-03 when call ends or eject fires. */
  const completeSession = useCallback(async () => {
    setFulfillment((prev) => (prev === 'done' ? prev : 'running'));
    try {
      const res = await fetch(`/api/session/${booking.id}/complete`, { method: 'POST' });
      const data = (await res.json()) as { error?: string; success?: boolean };
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not complete session');
      }
      setBookingStatus('completed');
      setFulfillment('done');
    } catch {
      setFulfillment('error');
    }
  }, [booking.id]);

  const handleCallEnded = useCallback(() => {
    setEnded(true);
    void completeSession();
  }, [completeSession]);

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
        <div className="flex items-center gap-3">
          {booking.showCaptionsForBuyer ? (
            <span
              data-testid="session-captions-indicator"
              className="text-label-sm text-on-surface-variant"
            >
              Captions on for {firstDisplayName(booking.menteeName)} ({booking.menteePreferredLocale})
            </span>
          ) : null}
          <span
            data-testid="session-status-badge"
            className="text-label-sm font-mono text-on-surface-variant uppercase"
          >
            {bookingStatus}
          </span>
        </div>
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
                The video room opens at your scheduled start time (
                <span suppressHydrationWarning>{formatSessionWhen(booking.scheduledAt)}</span>
                ). Join once the session begins.
              </p>
              <Link
                href={exitHref}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-5 py-2.5 text-label-sm font-semibold text-on-primary hover:bg-primary-container sm:w-auto"
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

          {booking.gate === 'ready' &&
            !ended &&
            !showPostSessionUi &&
            (booking.dailyRoomUrl || booking.e2eCaptionsStub) && (
            <div data-testid="session-join-ready" className="w-full">
              <DailyCallRoom booking={booking} onEnded={handleCallEnded} />
              <p className="mt-3 text-center text-label-sm text-on-surface-variant">
                Leave with End session when you are done. The call also ends automatically at the
                booked length. Your recap generates after the call ends.
              </p>
            </div>
          )}

          {booking.gate === 'ready' && !ended && !booking.dailyRoomUrl && !booking.e2eCaptionsStub && (
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

          {showPostSessionUi && (
            <SessionGatePanel testId="session-completed">
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Session completed</h3>
              {fulfillment === 'running' ? (
                <p className="text-body-md text-on-surface-variant mb-6" data-testid="session-complete-pending">
                  Finishing your session and generating the AI recap…
                </p>
              ) : null}
              {fulfillment === 'error' ? (
                <div className="mb-6 space-y-3" data-testid="session-complete-error">
                  <p className="text-body-md text-on-surface-variant">
                    Could not finalize the session automatically. Retry to generate the recap.
                  </p>
                  <button
                    type="button"
                    onClick={() => void completeSession()}
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-outline-variant px-5 py-2.5 text-label-sm font-semibold text-on-surface"
                  >
                    Retry recap
                  </button>
                </div>
              ) : null}
              {(isCompleted || fulfillment === 'done' || booking.gate === 'completed') && (
                <>
                  <SessionRecapPanel bookingId={booking.id} />
                  <SessionTranscriptPanel
                    bookingId={booking.id}
                    mentorName={booking.mentorName}
                    menteeName={booking.menteeName}
                    viewerRole={booking.sessionRole}
                  />
                </>
              )}
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
                This booking cannot be joined right now ({bookingStatus}).
              </p>
              <Link
                href={exitHref}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-label-sm font-semibold text-on-primary hover:bg-primary-container"
              >
                Back to dashboard
              </Link>
            </SessionGatePanel>
          )}

          {booking.gate === 'expired' && !showPostSessionUi && (
            <SessionGatePanel testId="session-expired">
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Join window closed</h3>
              <p className="text-body-md text-on-surface-variant mb-6 text-pretty">
                The scheduled join window for this session has ended. If the call already happened,
                you can still load the recap below.
              </p>
              <button
                type="button"
                data-testid="session-load-recap"
                onClick={() => {
                  setEnded(true);
                  void completeSession();
                }}
                className="mb-4 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-label-sm font-semibold text-on-primary hover:bg-primary-container"
              >
                Load session recap
              </button>
              <div>
                <Link
                  href={exitHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-outline-variant px-5 py-2.5 text-label-sm font-semibold text-on-surface"
                >
                  Back to dashboard
                </Link>
              </div>
            </SessionGatePanel>
          )}
          </div>
        </div>

        <aside className="w-full shrink-0 p-6 space-y-6 border-outline-variant bg-surface-container-lowest lg:w-96">
          <div>
            <h3 className="text-headline-md font-bold text-on-surface">
              {booking.sessionRole === 'mentor' ? 'Session prep' : 'Your session plan'}
            </h3>
            <p className="text-label-sm text-on-surface-variant mt-1">
              <span suppressHydrationWarning>{formatSessionWhen(booking.scheduledAt)}</span>
            </p>
          </div>
          {isSessionBriefing(booking.briefing) ? (
            <ul className="space-y-2 text-body-md text-on-surface-variant">
              {resolveSessionObjectives(
                booking.briefing,
                booking.sessionRole === 'mentor' ? 'mentor' : 'mentee',
              ).map((obj) => (
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
