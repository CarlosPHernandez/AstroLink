'use client';

import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { BookingSessionView } from '@/lib/booking-access';
import type { MentorBriefingOutput } from '@/lib/types';
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

function dashboardHref(role: BookingSessionView['sessionRole']): string {
  if (role === 'mentor') {
    return '/dashboard/mentor';
  }
  return '/dashboard/mentee';
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

      <div className="flex-grow flex flex-col lg:flex-row">
        <div className="flex-grow bg-surface-container flex flex-col items-center justify-center p-8 border-r border-outline-variant">
          {insecureMediaOrigin && (
            <div
              data-testid="session-insecure-origin-warning"
              className="w-full max-w-4xl mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-body-md text-on-surface"
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
            <div
              data-testid="session-pending-payment"
              className="text-center max-w-md p-8 border border-outline-variant rounded-lg bg-surface-container-lowest"
            >
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Payment required</h3>
              <p className="text-body-md text-on-surface-variant mb-6">
                Complete payment from your dashboard before joining the video room.
              </p>
              <Link
                href={exitHref}
                className="inline-block px-5 py-2.5 rounded-md bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container"
              >
                Back to dashboard
              </Link>
            </div>
          )}

          {booking.gate === 'too_early' && (
            <div
              data-testid="session-too-early"
              className="text-center max-w-md p-8 border border-outline-variant rounded-lg bg-surface-container-lowest"
            >
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Not open yet</h3>
              <p className="text-body-md text-on-surface-variant mb-4">
                The video room opens shortly before your scheduled session (
                <span suppressHydrationWarning>{formatSessionWhen(booking.scheduledAt)}</span>).
                Check back a few minutes before start time.
              </p>
              <Link
                href={exitHref}
                className="inline-block px-5 py-2.5 rounded-md bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container"
              >
                Back to dashboard
              </Link>
            </div>
          )}

          {booking.gate === 'expired' && (
            <div
              data-testid="session-expired"
              className="text-center max-w-md p-8 border border-outline-variant rounded-lg bg-surface-container-lowest"
            >
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Join window closed</h3>
              <p className="text-body-md text-on-surface-variant mb-4">
                The scheduled join window for this session has ended. If you still need help, contact
                support or book another session from your dashboard.
              </p>
              <Link
                href={exitHref}
                className="inline-block px-5 py-2.5 rounded-md bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container"
              >
                Back to dashboard
              </Link>
            </div>
          )}

          {booking.gate === 'provisioning' && (
            <div
              data-testid="session-provisioning"
              className="text-center max-w-md p-8 border border-outline-variant rounded-lg bg-surface-container-lowest"
            >
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
            </div>
          )}

          {booking.gate === 'ready' && !ended && booking.dailyJoinUrl && !booking.tokenError && (
            <div
              data-testid="session-join-ready"
              className="w-full max-w-4xl aspect-video rounded-lg border border-outline-variant overflow-hidden bg-surface-container-lowest shadow-sm"
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
            <div
              data-testid="session-token-error"
              className="text-center max-w-md p-8 border border-outline-variant rounded-lg bg-surface-container-lowest"
            >
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Could not join room</h3>
              <p className="text-body-md text-on-surface-variant mb-4">{booking.tokenError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-block px-5 py-2.5 rounded-md bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container"
              >
                Try again
              </button>
            </div>
          )}

          {booking.gate === 'ready' && !ended && !booking.dailyJoinUrl && !booking.tokenError && (
            <div
              data-testid="session-no-join-url"
              className="text-center max-w-md p-8 border border-outline-variant rounded-lg bg-surface-container-lowest"
            >
              <p className="text-body-md text-on-surface-variant mb-4">
                Video is unavailable — Daily is not configured for this environment.
              </p>
              <Link href={exitHref} className="text-primary text-label-sm font-semibold">
                Back to dashboard
              </Link>
            </div>
          )}

          {booking.gate === 'completed' && (
            <div
              data-testid="session-completed"
              className="text-center max-w-md p-8 border border-outline-variant rounded-lg bg-surface-container-lowest"
            >
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Session completed</h3>
              <p className="text-body-md text-on-surface-variant mb-6">
                Your recap and payment status are on your dashboard.
              </p>
              <Link
                href={exitHref}
                className="inline-block px-5 py-2.5 rounded-md bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container"
              >
                Back to dashboard
              </Link>
            </div>
          )}

          {(booking.gate === 'payment_failed' || booking.gate === 'unavailable') && (
            <div
              data-testid="session-unavailable"
              className="text-center max-w-md p-8 border border-outline-variant rounded-lg bg-surface-container-lowest"
            >
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Session unavailable</h3>
              <p className="text-body-md text-on-surface-variant mb-6">
                This booking cannot be joined right now ({booking.status}).
              </p>
              <Link
                href={exitHref}
                className="inline-block px-5 py-2.5 rounded-md bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container"
              >
                Back to dashboard
              </Link>
            </div>
          )}

          {booking.gate === 'ready' && ended && (
            <div
              data-testid="session-ended-local"
              className="text-center max-w-md p-8 border border-outline-variant rounded-lg bg-surface-container-lowest"
            >
              <h3 className="text-headline-md font-bold text-on-surface mb-2">Session ended</h3>
              <p className="text-body-md text-on-surface-variant mb-6">
                Post-session synthesis and payment capture run when everyone leaves the Daily call
                (webhook). Check your dashboard in a minute for the summary.
              </p>
              <Link
                href={exitHref}
                className="inline-block px-5 py-2.5 rounded-md bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container"
              >
                Back to dashboard
              </Link>
            </div>
          )}
        </div>

        <aside className="w-full lg:w-96 p-6 space-y-6 bg-surface-container-lowest border-outline-variant">
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
