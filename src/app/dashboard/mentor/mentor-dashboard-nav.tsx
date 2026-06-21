'use client';

import {
  PAYOUT_NAV_LABELS,
  type PayoutNavStatus,
} from '@/lib/mentor-payouts-config';

export type MentorDashboardTab = 'sessions' | 'earnings' | 'profile';

const TABS: { id: MentorDashboardTab; label: string }[] = [
  { id: 'sessions', label: 'Sessions' },
  { id: 'earnings', label: 'Earnings & payouts' },
  { id: 'profile', label: 'Profile' },
];

const PAYOUT_NAV_STYLES: Record<PayoutNavStatus, string> = {
  dev_skip: 'text-emerald-700',
  manual: 'text-on-surface',
  connected: 'text-emerald-700',
  setup_required: 'text-amber-700',
};

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
    <aside className="lg:col-span-3 w-full">
      <nav
        className="flex flex-row gap-1 overflow-x-auto border-b border-outline-variant pb-2 lg:flex-col lg:overflow-x-visible lg:border-b-0 lg:pb-0"
        aria-label="Mentor dashboard"
        role="tablist"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            data-testid={`mentor-tab-${tab.id}`}
            className={`rounded-md px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-surface-container text-on-surface'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="mt-6 hidden border-t border-outline-variant/40 pt-4 lg:block">
        <p className="text-xs text-on-surface-variant">Payout account</p>
        <p
          className={`mt-1 text-sm font-medium ${PAYOUT_NAV_STYLES[payoutNavStatus]}`}
          data-testid="mentor-payout-nav-status"
        >
          {PAYOUT_NAV_LABELS[payoutNavStatus]}
        </p>
      </div>
    </aside>
  );
}