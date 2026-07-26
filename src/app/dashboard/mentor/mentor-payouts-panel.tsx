'use client';

import { useState } from 'react';
import { formatMoney, formatSessionWhen } from '@/lib/format';
import type { MentorEarningRow, MentorEarningsSummary } from '@/lib/mentor-earnings-types';
import {
  resolvePayoutNavStatus,
  type PayoutNavStatus,
} from '@/lib/mentor-payouts-config';
import { MentorPageHeader } from '@/app/dashboard/mentor/mentor-page-header';

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

function transferChipClass(status: MentorEarningRow['transferStatus']): string {
  switch (status) {
    case 'awaiting':
      return 'md-chip md-chip-warn';
    case 'transferred':
      return 'md-chip md-chip-success';
    default:
      return 'md-chip md-chip-neutral';
  }
}

function paymentChipClass(status: MentorEarningRow['status']): string {
  switch (status) {
    case 'completed':
      return 'md-chip md-chip-success';
    case 'refunded':
      return 'md-chip md-chip-danger';
    case 'pending':
      return 'md-chip md-chip-warn';
    default:
      return 'md-chip md-chip-neutral';
  }
}

function EarningsSummaryCards({ summary }: { summary: MentorEarningsSummary }) {
  return (
    <div className="md-card-grid md-card-grid-3">
      <div className="md-card">
        <p className="md-card-label">Recorded share</p>
        <p className="md-card-primary">{formatMoney(summary.recordedShareCents)}</p>
        <p className="md-card-meta">
          {summary.sessionCount} recorded session{summary.sessionCount === 1 ? '' : 's'}
        </p>
      </div>
      <div className="md-card">
        <p className="md-card-label">Awaiting transfer</p>
        <p className="md-card-primary md-card-primary-warn">
          {formatMoney(summary.awaitingTransferCents)}
        </p>
        <p className="md-card-meta">Your share not yet sent to your bank</p>
      </div>
      <div className="md-card">
        <p className="md-card-label">Transferred</p>
        <p className="md-card-primary md-card-primary-success">
          {formatMoney(summary.transferredCents)}
        </p>
        <p className="md-card-meta">Paid to your bank by AstroLink ops</p>
      </div>
    </div>
  );
}

function EarningsLedger({ rows }: { rows: MentorEarningRow[] }) {
  return (
    <div className="md-table-wrap" data-testid="mentor-earnings-ledger">
      <table className="md-table">
        <thead>
          <tr>
            <th>Session</th>
            <th>Buyer</th>
            <th>Gross</th>
            <th>Your payout</th>
            <th>Payment</th>
            <th>Transfer</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} data-testid="mentor-earnings-empty">
                No earnings yet. When a buyer pays for a session, the split and status appear here.
              </td>
            </tr>
          ) : null}
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="md-table-strong">
                <span suppressHydrationWarning>{formatSessionWhen(row.scheduledAt)}</span>
              </td>
              <td>{row.menteeName}</td>
              <td>{formatMoney(row.grossCents)}</td>
              <td className="md-table-strong">{formatMoney(row.mentorPayoutCents)}</td>
              <td>
                <span className={paymentChipClass(row.status)}>
                  {paymentStatusLabel(row.status)}
                </span>
              </td>
              <td>
                <span className={transferChipClass(row.transferStatus)}>
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
    <div className="md-card">
      <div>
        <h3 className="md-card-title">Session payout estimator</h3>
        <p className="md-card-meta" style={{ marginTop: 4 }}>
          AstroLink collects payment when buyers book. After session completion, we record{' '}
          {Math.round(MENTOR_SHARE_RATE * 100)}% to you / {Math.round(PLATFORM_FEE_RATE * 100)}%
          platform fee. Rate: {formatMoney(hourlyRateDollars * 100)}/hr.
        </p>
      </div>

      <div>
        <div className="md-card-head" style={{ marginBottom: 8 }}>
          <label htmlFor="session-duration" className="md-card-meta">
            Session length
          </label>
          <span className="md-card-meta" style={{ color: 'var(--md-text)' }}>
            {durationMinutes} min
          </span>
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

      <div className="md-card-grid md-card-grid-3">
        <div className="md-card" style={{ background: 'var(--md-surface-soft)' }}>
          <p className="md-card-label">Buyer pays</p>
          <p className="md-card-title">{formatMoney(grossCents)}</p>
        </div>
        <div className="md-card" style={{ background: 'var(--md-surface-soft)' }}>
          <p className="md-card-label">Platform fee</p>
          <p className="md-card-title">{formatMoney(platformFeeCents)}</p>
        </div>
        <div className="md-card" style={{ background: 'var(--md-surface-soft)' }}>
          <p className="md-card-label">You receive</p>
          <p className="md-card-title" style={{ color: 'var(--md-accent)' }}>
            {formatMoney(mentorPayoutCents)}
          </p>
        </div>
      </div>
    </div>
  );
}

const PAYOUT_BADGE_LABELS: Record<PayoutNavStatus, string> = {
  dev_skip: 'Dev mode',
  manual: 'Manual at launch',
  connected: 'Connected',
  setup_required: 'Not connected',
};

function payoutChipClass(status: PayoutNavStatus): string {
  switch (status) {
    case 'dev_skip':
    case 'connected':
      return 'md-chip md-chip-success';
    case 'manual':
      return 'md-chip md-chip-neutral';
    case 'setup_required':
      return 'md-chip md-chip-warn';
  }
}

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
    <div className="md-stack" data-testid="mentor-earnings-tab">
      <MentorPageHeader
        as="h2"
        title="Earnings & payouts"
        description={
          showConnectActions
            ? 'Track session revenue from AstroLink bookings and manage your Stripe payout account.'
            : 'Track session revenue from AstroLink bookings.'
        }
      />

      <section className="md-stack-tight">
        <h3 className="md-section-label">Income summary</h3>
        <EarningsSummaryCards summary={summary} />
        <EarningsLedger rows={rows} />
      </section>

      <section className="md-stack-tight">
        <h3 className="md-section-label">Bank account</h3>
        <div
          className="md-card"
          data-testid={payoutStatus === 'manual' ? 'mentor-payouts-manual' : undefined}
        >
          <div className="md-card-head">
            <p className="md-card-title">
              {payoutStatus === 'manual' ? 'Payouts at launch' : 'Stripe Connect'}
            </p>
            <span className={payoutChipClass(payoutStatus)}>
              {PAYOUT_BADGE_LABELS[payoutStatus]}
            </span>
          </div>

          <p className="md-card-meta">
            {payoutStatus === 'dev_skip'
              ? 'Stripe is turned off in this environment. Earnings above reflect test bookings only.'
              : payoutStatus === 'manual'
                ? 'Payouts are processed manually at launch. Your 80% mentor share is recorded per session; bank transfers are handled by AstroLink ops until Stripe Connect goes live.'
                : 'Connect your bank account via Stripe to receive mentor payouts after completed sessions.'}
          </p>

          {stripeConnectAccountId ? (
            <p className="md-card-meta" style={{ fontFamily: 'ui-monospace, monospace' }}>
              Account {stripeConnectAccountId.slice(0, 12)}…
            </p>
          ) : null}
          {stripeError ? (
            <p className="md-card-meta md-overview-meta-warn" role="alert">
              {stripeError}
            </p>
          ) : null}

          {showConnectActions ? (
            <>
              <hr className="md-card-divider" />
              <div className="md-btn-row">
                {payoutStatus === 'setup_required' ? (
                  <button
                    type="button"
                    onClick={() => openStripe('onboard')}
                    disabled={stripeLoading}
                    data-testid="mentor-stripe-onboard"
                    className="md-btn md-btn-primary"
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
                    className="md-btn md-btn-ghost"
                  >
                    {stripeLoading ? 'Opening…' : 'Open Stripe dashboard'}
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section>
        <FeeEstimator hourlyRateDollars={hourlyRateDollars} />
      </section>
    </div>
  );
}
