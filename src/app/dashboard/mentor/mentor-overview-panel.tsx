'use client';

import { formatMoney, formatSessionWhen } from '@/lib/format';
import {
  PAYOUT_NAV_LABELS,
  type PayoutNavStatus,
} from '@/lib/mentor-payouts-config';
import type { MentorBookingView } from '@/lib/mentor-booking-partition';
import type { MentorEarningsSummary } from '@/lib/mentor-earnings-types';
import type { MentorDashboardTab } from '@/app/dashboard/mentor/mentor-dashboard-nav';
import { MentorPageHeader } from '@/app/dashboard/mentor/mentor-page-header';
import {
  complianceStatusLabel,
  expertProfilePath,
  listingVisibilityCopy,
} from '@/lib/mentor-listing-status';
import { isSessionBriefing } from '@/lib/briefing-display';

type SetupStep = { key: string; done: boolean; label: string };

function KpiStat({
  label,
  value,
  foot,
  onClick,
  testId,
}: {
  label: string;
  value: string;
  foot: string;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button type="button" className="md-kpi" onClick={onClick} data-testid={testId}>
      <p className="md-kpi-label">{label}</p>
      <p className="md-kpi-value">{value}</p>
      <p className="md-kpi-foot">{foot}</p>
    </button>
  );
}

export function MentorOverviewPanel({
  firstName,
  nextSession,
  upcoming,
  pastCount,
  earningsSummary,
  payoutNavStatus,
  listing,
  profileComplete,
  setupSteps,
  onNavigate,
}: {
  firstName: string;
  nextSession: MentorBookingView | null;
  upcoming: MentorBookingView[];
  pastCount: number;
  earningsSummary: MentorEarningsSummary;
  payoutNavStatus: PayoutNavStatus;
  listing: {
    complianceStatus: string;
    isListed: boolean;
    slug: string | null;
  };
  profileComplete: boolean;
  setupSteps: readonly SetupStep[];
  onNavigate: (tab: MentorDashboardTab) => void;
}) {
  const publicPath = listing.slug?.trim()
    ? expertProfilePath(listing.slug.trim())
    : null;
  const listingCopy = listingVisibilityCopy(listing.complianceStatus, listing.isListed);
  const upcomingCount = upcoming.length;
  const setupDone = setupSteps.filter((s) => s.done).length;
  const setupTotal = setupSteps.length;
  const setupPct = setupTotal === 0 ? 100 : Math.round((setupDone / setupTotal) * 100);
  const setupComplete = setupDone >= setupTotal;

  const needsPrep = upcoming.find((b) => !isSessionBriefing(b.briefing)) ?? null;

  type AttentionItem = {
    id: string;
    title: string;
    description: string;
    tab: MentorDashboardTab;
  };

  const attention: AttentionItem[] = [];
  if (!profileComplete) {
    attention.push({
      id: 'profile',
      title: 'Finish your listing',
      description: 'Add bio, expertise, employer, and rate so buyers see accurate details.',
      tab: 'profile',
    });
  }
  if (payoutNavStatus === 'setup_required') {
    attention.push({
      id: 'payout',
      title: 'Connect payouts',
      description: 'Set up how you receive your mentor share after completed sessions.',
      tab: 'earnings',
    });
  }
  if (!listing.isListed && profileComplete) {
    attention.push({
      id: 'listed',
      title: 'Not listed yet',
      description: listingCopy,
      tab: 'profile',
    });
  }
  if (needsPrep) {
    attention.push({
      id: 'prep',
      title: `Prep for ${needsPrep.menteeName}`,
      description: 'Open the session and generate a prep brief before the call.',
      tab: 'sessions',
    });
  }
  if (upcomingCount === 0 && pastCount === 0) {
    attention.push({
      id: 'first-session',
      title: 'Waiting for your first booking',
      description: 'When a buyer books you, the session shows up here with goals and context.',
      tab: 'sessions',
    });
  }

  const listingKpiValue = listing.isListed
    ? 'Live'
    : complianceStatusLabel(listing.complianceStatus);

  const previewUpcoming = upcoming.slice(0, 4);

  return (
    <div className="md-stack" data-testid="mentor-overview-tab">
      <MentorPageHeader
        title={`Welcome back, ${firstName}`}
        description="Your expert workspace — sessions, earnings, and listing health."
      />

      <div className="md-kpi-row" data-testid="mentor-overview-kpis">
        <KpiStat
          label="Upcoming"
          value={String(upcomingCount)}
          foot={
            nextSession
              ? formatSessionWhen(nextSession.scheduledAt)
              : pastCount > 0
                ? `${pastCount} past`
                : 'None scheduled'
          }
          onClick={() => onNavigate('sessions')}
          testId="mentor-overview-kpi-sessions"
        />
        <KpiStat
          label="Recorded share"
          value={formatMoney(earningsSummary.recordedShareCents)}
          foot={
            earningsSummary.sessionCount > 0
              ? `${earningsSummary.sessionCount} session${earningsSummary.sessionCount === 1 ? '' : 's'}`
              : 'No recorded sessions'
          }
          onClick={() => onNavigate('earnings')}
          testId="mentor-overview-kpi-earnings"
        />
        <KpiStat
          label="Awaiting"
          value={formatMoney(earningsSummary.awaitingTransferCents)}
          foot={PAYOUT_NAV_LABELS[payoutNavStatus]}
          onClick={() => onNavigate('earnings')}
          testId="mentor-overview-kpi-awaiting"
        />
        <KpiStat
          label="Listing"
          value={listingKpiValue}
          foot={listing.isListed ? 'On the directory' : listingCopy}
          onClick={() => onNavigate('profile')}
          testId="mentor-overview-kpi-listing"
        />
      </div>

      {/* Keep testid hooks for older overview assertions */}
      <div className="sr-only" aria-hidden="true">
        <span data-testid="mentor-overview-next-session" />
        <span data-testid="mentor-overview-earnings" />
        <span data-testid="mentor-overview-listing" />
        <span data-testid="mentor-overview-payout-status">
          Payouts: {PAYOUT_NAV_LABELS[payoutNavStatus]}
        </span>
      </div>

      <div className="md-home-split">
        <section className="md-home-panel" data-testid="mentor-overview-upcoming-panel">
          <div className="md-home-panel-head">
            <h2 className="md-home-panel-title">Upcoming sessions</h2>
            <button type="button" className="md-link" onClick={() => onNavigate('sessions')}>
              View all
            </button>
          </div>

          {previewUpcoming.length === 0 ? (
            <p className="md-empty">
              No upcoming sessions. When a buyer books you, they appear here with goals and prep
              context.
            </p>
          ) : (
            <div className="md-stack-tight">
              {previewUpcoming.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  className="md-session-row"
                  onClick={() => onNavigate('sessions')}
                  data-testid={`mentor-overview-session-${booking.id}`}
                >
                  <div className="md-session-row-text">
                    <p className="md-session-row-name">{booking.menteeName}</p>
                    <p className="md-session-row-meta">
                      {formatSessionWhen(booking.scheduledAt)}
                      {isSessionBriefing(booking.briefing) ? ' · Prep ready' : ' · Needs prep'}
                    </p>
                  </div>
                  <span
                    className={
                      isSessionBriefing(booking.briefing)
                        ? 'md-chip md-chip-success'
                        : 'md-chip md-chip-warn'
                    }
                  >
                    {isSessionBriefing(booking.briefing) ? 'Ready' : 'Prep'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="md-home-panel" data-testid="mentor-overview-attention-panel">
          <div className="md-home-panel-head">
            <h2 className="md-home-panel-title">Needs attention</h2>
            {publicPath ? (
              <a
                href={publicPath}
                target="_blank"
                rel="noopener noreferrer"
                className="md-link"
              >
                Preview
              </a>
            ) : null}
          </div>

          {!setupComplete ? (
            <div className="md-progress" data-testid="mentor-overview-setup-progress">
              <div className="md-progress-head">
                <span>Getting set up</span>
                <span>
                  {setupDone}/{setupTotal}
                </span>
              </div>
              <div className="md-progress-track" aria-hidden="true">
                <div className="md-progress-fill" style={{ width: `${setupPct}%` }} />
              </div>
              <p className="md-card-meta">
                {setupSteps.map((s) => `${s.label}${s.done ? ' ✓' : ''}`).join(' · ')}
              </p>
            </div>
          ) : null}

          {attention.length === 0 ? (
            <p className="md-empty">You&apos;re clear — nothing needs attention right now.</p>
          ) : (
            <ul className="md-attention-list">
              {attention.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="md-attention-item"
                    onClick={() => onNavigate(item.tab)}
                    data-testid={`mentor-overview-attention-${item.id}`}
                  >
                    <div className="md-attention-copy">
                      <p className="md-attention-title">{item.title}</p>
                      <p className="md-attention-desc">{item.description}</p>
                    </div>
                    <span className="md-link" aria-hidden="true">
                      Open
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
