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
    <div className="md-nav-block">
      <nav className="md-seg" aria-label="Mentor dashboard" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            data-testid={`mentor-tab-${tab.id}`}
            className={
              activeTab === tab.id ? 'md-seg-item md-seg-item-active' : 'md-seg-item'
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
