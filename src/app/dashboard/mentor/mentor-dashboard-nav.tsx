'use client';

import {
  PAYOUT_NAV_LABELS,
  type PayoutNavStatus,
} from '@/lib/mentor-payouts-config';

export type MentorDashboardTab = 'sessions' | 'earnings' | 'profile';

const TABS: { id: MentorDashboardTab; label: string }[] = [
  { id: 'sessions', label: 'Sessions' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'profile', label: 'Profile' },
];

export function MentorDashboardNav({
  activeTab,
  onTabChange,
  payoutNavStatus,
}: {
  activeTab: MentorDashboardTab;
  onTabChange: (tab: MentorDashboardTab) => void;
  payoutNavStatus: PayoutNavStatus;
}) {
  return (
    <div>
      <nav className="md-tabs" aria-label="Mentor dashboard" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            data-testid={`mentor-tab-${tab.id}`}
            className={
              activeTab === tab.id ? 'md-tab md-tab-active' : 'md-tab'
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <p className="md-payout-aside" data-testid="mentor-payout-nav-status">
        Payouts: {PAYOUT_NAV_LABELS[payoutNavStatus]}
      </p>
    </div>
  );
}
