'use client';

import { useState } from 'react';
import { formatMoney, formatSessionWhen } from '@/lib/format';
import type { MentorEarningRow, MentorEarningsSummary } from '@/lib/mentor-earnings-types';
import {
  resolvePayoutNavStatus,
  type PayoutNavStatus,
} from '@/lib/mentor-payouts-config';

const PLATFORM_FEE_RATE = 0.2;
const MENTOR_SHARE_RATE = 0.8;

function paymentStatusLabel(status: MentorEarningRow['status']): string {
  switch (status) {
    case 'completed':
      return 'Recorded';
    case 'refunded':
      return 'Refunded';
    case 'pending':
      return 'Pending';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

function transferStatusLabel(status: MentorEarningRow['transferStatus']): string {
  switch (status) {
    case 'awaiting':
      return 'Awaiting';
    case 'transferred':
      return 'Transferred';
    default:
      return '—';
  }
}

function transferStatusStyles(status: MentorEarningRow['transferStatus']): string {
  switch (status) {
    case 'awaiting':
      return 'bg-amber-50 text-amber-800';
    case 'transferred':
      return 'bg-emerald-50 text-emerald-800';
    default:
      return 'bg-surface-container text-on-surface-variant';
  }
}

function paymentStatusStyles(status: MentorEarningRow['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-50 text-emerald-800';
    case 'refunded':
      return 'bg-red-50 text-red-800';
    case 'pending':
      return 'bg-amber-50 text-amber-800';
    default:
      return 'bg-surface-container text-on-surface-variant';
  }
}

function EarningsSummaryCards({ summary }: { summary: MentorEarningsSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <p className="text-xs text-on-surface-variant">Recorded share</p>
        <p className="mt-1 text-xl font-semibold text-on-surface">
          {formatMoney(summary.recordedShareCents)}
        </p>
        <p className="mt-1 text-[11px] text-on-surface-variant">
          {summary.sessionCount} recorded session{summary.sessionCount === 1 ? '' : 's'}
        </p>
      </div>
      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <p className="text-xs text-on-surface-variant">Awaiting transfer</p>
        <p className="mt-1 text-xl font-semibold text-amber-700">
          {formatMoney(summary.awaitingTransferCents)}
        </p>
        <p className="mt-1 text-[11px] text-on-surface-variant">
          Your share not yet sent to your bank
        </p>
      </div>
      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <p className="text-xs text-on-surface-variant">Transferred</p>
        <p className="mt-1 text-xl font-semibold text-emerald-700">
          {formatMoney(summary.transferredCents)}
        </p>
        <p className="mt-1 text-[11px] text-on-surface-variant">
          Paid to your bank by AstroLink ops
        </p>
      </div>
    </div>
  );
}

function EarningsLedger({ rows }: { rows: MentorEarningRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-outline-variant" data-testid="mentor-earnings-ledger">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase text-on-surface-variant">
          <tr>
            <th className="px-4 py-3 font-medium">Session</th>
            <th className="px-4 py-3 font-medium">Buyer</th>
            <th className="px-4 py-3 font-medium">Gross</th>
            <th className="px-4 py-3 font-medium">Your payout</th>
            <th className="px-4 py-3 font-medium">Payment</th>
            <th className="px-4 py-3 font-medium">Transfer</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-6 text-sm text-on-surface-variant"
                data-testid="mentor-earnings-empty"
              >
                No earnings yet. When a buyer pays for a session, the split and status appear here.
              </td>
            </tr>
          ) : null}
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-outline-variant/40 last:border-0">
              <td className="px-4 py-3 text-on-surface">
                <span suppressHydrationWarning>{formatSessionWhen(row.scheduledAt)}</span>
              </td>
              <td className="px-4 py-3 text-on-surface-variant">{row.menteeName}</td>
              <td className="px-4 py-3 text-on-surface-variant">{formatMoney(row.grossCents)}</td>
              <td className="px-4 py-3 font-medium text-on-surface">
                {formatMoney(row.mentorPayoutCents)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${paymentStatusStyles(row.status)}`}
                >
                  {paymentStatusLabel(row.status)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${transferStatusStyles(row.transferStatus)}`}
                >
                  {transferStatusLabel(row.transferStatus)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeeEstimator({ hourlyRateDollars }: { hourlyRateDollars: number }) {
  const [durationMinutes, setDurationMinutes] = useState(30);
  const grossCents = Math.round(hourlyRateDollars * (durationMinutes / 60) * 100);
  const platformFeeCents = Math.round(grossCents * PLATFORM_FEE_RATE);
  const mentorPayoutCents = grossCents - platformFeeCents;

  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-5">
      <h3 className="text-sm font-semibold text-on-surface">Session payout estimator</h3>
      <p className="mt-1 text-xs text-on-surface-variant">
        AstroLink collects payment when buyers book. After session completion, we record{' '}
        {Math.round(MENTOR_SHARE_RATE * 100)}% to you / {Math.round(PLATFORM_FEE_RATE * 100)}%
        platform fee. Rate: {formatMoney(hourlyRateDollars * 100)}/hr.
      </p>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-on-surface-variant">
          <label htmlFor="session-duration">Session length</label>
          <span className="font-medium text-on-surface">{durationMinutes} min</span>
        </div>
        <input
          id="session-duration"
          type="range"
          min={15}
          max={120}
          step={15}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface-container accent-primary"
        />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-md bg-surface-container-low p-3">
          <dt className="text-xs text-on-surface-variant">Buyer pays</dt>
          <dd className="mt-1 font-semibold text-on-surface">{formatMoney(grossCents)}</dd>
        </div>
        <div className="rounded-md bg-surface-container-low p-3">
          <dt className="text-xs text-on-surface-variant">Platform fee</dt>
          <dd className="mt-1 font-semibold text-on-surface-variant">
            {formatMoney(platformFeeCents)}
          </dd>
        </div>
        <div className="rounded-md bg-surface-container-low p-3">
          <dt className="text-xs text-on-surface-variant">You receive</dt>
          <dd className="mt-1 font-semibold text-primary">{formatMoney(mentorPayoutCents)}</dd>
        </div>
      </dl>
    </div>
  );
}

const PAYOUT_BADGE_LABELS: Record<PayoutNavStatus, string> = {
  dev_skip: 'Dev mode',
  manual: 'Manual at launch',
  connected: 'Connected',
  setup_required: 'Not connected',
};

const PAYOUT_BADGE_STYLES: Record<PayoutNavStatus, string> = {
  dev_skip: 'bg-emerald-50 text-emerald-800',
  manual: 'bg-surface-container text-on-surface-variant',
  connected: 'bg-emerald-50 text-emerald-800',
  setup_required: 'bg-amber-50 text-amber-800',
};

export function MentorPayoutsPanel({
  summary,
  rows,
  hourlyRateDollars,
  stripeOnboardingCompleted,
  stripeConnectAccountId,
  skipStripePayments,
  connectPayoutsEnabled,
}: {
  summary: MentorEarningsSummary;
  rows: MentorEarningRow[];
  hourlyRateDollars: number;
  stripeOnboardingCompleted: boolean;
  stripeConnectAccountId: string | null;
  skipStripePayments: boolean;
  connectPayoutsEnabled: boolean;
}) {
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const payoutStatus = resolvePayoutNavStatus({
    skipStripePayments,
    connectPayoutsEnabled,
    stripeOnboardingCompleted,
  });

  const showConnectActions = payoutStatus === 'setup_required' || payoutStatus === 'connected';

  async function openStripe(action: 'onboard' | 'dashboard') {
    setStripeLoading(true);
    setStripeError(null);
    try {
      const res = await fetch('/api/mentor/stripe-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: { mode?: string; url?: string; message?: string };
      };

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Could not open Stripe');
      }

      if (json.data?.mode === 'dev_skip') {
        setStripeError(json.data.message ?? 'Stripe is disabled in this environment.');
        return;
      }

      if (json.data?.url) {
        window.location.href = json.data.url;
      }
    } catch (err) {
      setStripeError(err instanceof Error ? err.message : 'Could not open Stripe');
    } finally {
      setStripeLoading(false);
    }
  }

  return (
    <div className="space-y-8" data-testid="mentor-earnings-tab">
      <header>
        <h2 className="text-lg font-semibold text-on-surface">Earnings & payouts</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Track session revenue from AstroLink bookings
          {showConnectActions ? ' and manage your Stripe payout account' : ''}.
        </p>
      </header>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-on-surface">Income summary</h3>
        <EarningsSummaryCards summary={summary} />
        <EarningsLedger rows={rows} />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-on-surface">Bank account</h3>
        <div
          className="space-y-4 rounded-lg border border-outline-variant bg-surface p-5"
          data-testid={payoutStatus === 'manual' ? 'mentor-payouts-manual' : undefined}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="min-w-0 text-sm font-medium text-on-surface">
              {payoutStatus === 'manual' ? 'Payouts at launch' : 'Stripe Connect'}
            </p>
            <span
              className={`inline-flex shrink-0 items-center rounded px-2 py-1 text-xs font-medium ${PAYOUT_BADGE_STYLES[payoutStatus]}`}
            >
              {PAYOUT_BADGE_LABELS[payoutStatus]}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-on-surface-variant">
            {payoutStatus === 'dev_skip'
              ? 'Stripe is turned off in this environment. Earnings above reflect test bookings only.'
              : payoutStatus === 'manual'
                ? 'Payouts are processed manually at launch. Your 80% mentor share is recorded per session; bank transfers are handled by AstroLink ops until Stripe Connect goes live.'
                : 'Connect your bank account via Stripe to receive mentor payouts after completed sessions.'}
          </p>

          {stripeConnectAccountId ? (
            <p className="font-mono text-xs text-on-surface-variant">
              Account {stripeConnectAccountId.slice(0, 12)}…
            </p>
          ) : null}
          {stripeError ? (
            <p className="text-xs text-amber-800" role="alert">
              {stripeError}
            </p>
          ) : null}

          {showConnectActions ? (
            <div className="flex flex-wrap gap-2 border-t border-outline-variant/40 pt-4">
              {payoutStatus === 'setup_required' ? (
                <button
                  type="button"
                  onClick={() => openStripe('onboard')}
                  disabled={stripeLoading}
                  data-testid="mentor-stripe-onboard"
                  className="cursor-pointer rounded-md bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-primary-container disabled:opacity-50"
                >
                  {stripeLoading ? 'Opening…' : 'Connect bank account'}
                </button>
              ) : null}
              {payoutStatus === 'connected' ? (
                <button
                  type="button"
                  onClick={() => openStripe('dashboard')}
                  disabled={stripeLoading}
                  data-testid="mentor-stripe-dashboard"
                  className="cursor-pointer rounded-md border border-outline-variant px-4 py-2 text-xs font-semibold uppercase tracking-wide text-on-surface hover:bg-surface-container-low disabled:opacity-50"
                >
                  {stripeLoading ? 'Opening…' : 'Open Stripe dashboard'}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <FeeEstimator hourlyRateDollars={hourlyRateDollars} />
      </section>
    </div>
  );
}
