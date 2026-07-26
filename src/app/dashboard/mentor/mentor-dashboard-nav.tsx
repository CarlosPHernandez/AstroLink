'use client';

import {
  PAYOUT_NAV_LABELS,
  type PayoutNavStatus,
} from '@/lib/mentor-payouts-config';
import { logoutAction } from '@/app/auth/actions';
import { MentorBrandFooter } from '@/app/dashboard/mentor/mentor-brand-footer';

export type MentorDashboardTab =
  | 'overview'
  | 'sessions'
  | 'earnings'
  | 'profile'
  | 'settings';

type NavItem = {
  id: MentorDashboardTab;
  label: string;
  icon: 'home' | 'sessions' | 'earnings' | 'listing' | 'settings';
};

const PRIMARY_NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'sessions', label: 'Sessions', icon: 'sessions' },
  { id: 'earnings', label: 'Earnings', icon: 'earnings' },
  { id: 'profile', label: 'Listing', icon: 'listing' },
];

const ACCOUNT_NAV: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

function NavIcon({ name, className }: { name: NavItem['icon']; className?: string }) {
  const common = {
    className,
    width: 16,
    height: 16,
    viewBox: '0 0 16 16',
    fill: 'none',
    'aria-hidden': true as const,
  };

  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path
            d="M2.5 6.5 8 2l5.5 4.5V13a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V6.5Z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path
            d="M6 14V9h4v5"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'sessions':
      return (
        <svg {...common}>
          <rect
            x="2"
            y="3"
            width="12"
            height="11"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.25"
          />
          <path d="M2 6.5h12M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      );
    case 'earnings':
      return (
        <svg {...common}>
          <rect
            x="1.75"
            y="4"
            width="12.5"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.25"
          />
          <circle cx="8" cy="8" r="1.75" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      );
    case 'listing':
      return (
        <svg {...common}>
          <circle cx="8" cy="5.25" r="2.5" stroke="currentColor" strokeWidth="1.25" />
          <path
            d="M2.75 13.25c.7-2.1 2.4-3.25 5.25-3.25s4.55 1.15 5.25 3.25"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25" />
          <path
            d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M12.6 3.4l-1.06 1.06M4.46 11.54l-1.06 1.06"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function NavButton({
  item,
  selected,
  onTabChange,
  showSessionsBadge,
  showPayoutDot,
  upcomingCount,
  payoutLabel,
}: {
  item: NavItem;
  selected: boolean;
  onTabChange: (tab: MentorDashboardTab) => void;
  showSessionsBadge?: boolean;
  showPayoutDot?: boolean;
  upcomingCount?: number;
  payoutLabel?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => onTabChange(item.id)}
      data-testid={`mentor-tab-${item.id}`}
      className={selected ? 'md-sidebar-item md-sidebar-item-active' : 'md-sidebar-item'}
    >
      <span className="md-sidebar-item-main">
        <NavIcon name={item.icon} className="md-sidebar-item-icon" />
        <span className="md-sidebar-item-label">{item.label}</span>
      </span>
      {showPayoutDot ? (
        <span
          className="md-sidebar-dot"
          title={payoutLabel ? `Payouts: ${payoutLabel}` : undefined}
          data-testid="mentor-payout-nav-dot"
        />
      ) : null}
      {showSessionsBadge && upcomingCount != null && upcomingCount > 0 ? (
        <span className="md-sidebar-badge" data-testid="mentor-sessions-badge">
          {upcomingCount > 99 ? '99+' : upcomingCount}
        </span>
      ) : null}
    </button>
  );
}

export function MentorDashboardNav({
  activeTab,
  onTabChange,
  payoutNavStatus,
  expertName,
  expertInitials,
  upcomingCount = 0,
}: {
  activeTab: MentorDashboardTab;
  onTabChange: (tab: MentorDashboardTab) => void;
  payoutNavStatus: PayoutNavStatus;
  expertName: string;
  expertInitials: string;
  upcomingCount?: number;
}) {
  const payoutNeedsAttention = payoutNavStatus === 'setup_required';
  const payoutLabel = PAYOUT_NAV_LABELS[payoutNavStatus];

  return (
    <aside className="md-sidebar" data-testid="mentor-dashboard-sidebar">
      <div className="md-sidebar-brand">
        <div className="md-sidebar-brand-row">
          <div className="md-sidebar-avatar" aria-hidden="true">
            {expertInitials}
          </div>
          <div className="md-sidebar-brand-text">
            <p className="md-sidebar-brand-name">{expertName}</p>
            <p className="md-sidebar-brand-meta">Expert</p>
          </div>
        </div>
      </div>

      <div className="md-sidebar-body">
        <div className="md-sidebar-nav-groups">
          <div className="md-sidebar-nav-block">
            <p className="md-sidebar-section-label">Workspace</p>
            <nav className="md-sidebar-nav" aria-label="Mentor dashboard" role="tablist">
              {PRIMARY_NAV.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  selected={activeTab === item.id}
                  onTabChange={onTabChange}
                  showSessionsBadge={item.id === 'sessions'}
                  showPayoutDot={item.id === 'earnings' && payoutNeedsAttention}
                  upcomingCount={upcomingCount}
                  payoutLabel={payoutLabel}
                />
              ))}
            </nav>
            <p className="md-payout-aside" data-testid="mentor-payout-nav-status">
              Payouts: {payoutLabel}
            </p>
          </div>

          <div className="md-sidebar-nav-block">
            <p className="md-sidebar-section-label">Account</p>
            <nav className="md-sidebar-nav" aria-label="Account" role="tablist">
              {ACCOUNT_NAV.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  selected={activeTab === item.id}
                  onTabChange={onTabChange}
                />
              ))}
            </nav>
          </div>
        </div>

        <div className="md-sidebar-footer">
          <div className="md-sidebar-user-row">
            <div className="md-sidebar-user" data-testid="mentor-sidebar-user">
              <div className="md-sidebar-user-avatar" aria-hidden="true">
                {expertInitials}
              </div>
              <span className="md-sidebar-user-name">{expertName}</span>
            </div>
            <button
              type="button"
              onClick={() => logoutAction()}
              className="md-sign-out"
              data-testid="mentor-sign-out"
            >
              Sign out
            </button>
          </div>
          <MentorBrandFooter />
        </div>
      </div>
    </aside>
  );
}
