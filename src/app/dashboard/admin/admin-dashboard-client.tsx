'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { logoutAction } from '@/app/auth/actions';
import { CreateExpertPanel } from './create-expert-panel';
import { MentorPayoutsPanel } from './mentor-payouts-panel';

type WaitlistMetrics = {
  total: number;
  last7d: number;
  prev7d: number;
  wowPercent: number | null;
  dailyTrend: Array<{ day: string; signups: number }>;
  topReferrers: Array<{ referrer: string; signups: number }>;
};

type WaitlistSignup = {
  id: string;
  email: string;
  referrer: string | null;
  createdAt: string;
};

type ChrisCampaignMetrics = {
  campaignId: string;
  slotCap: number;
  slotsReserved: number;
  slotsRemaining: number;
  bookingsByStatus: Record<string, number>;
  bookingsByReferrer: Array<{ referrer: string; count: number }>;
};

function formatWowLabel(wowPercent: number | null): string {
  if (wowPercent === null) return 'New baseline';
  if (wowPercent > 0) return `+${wowPercent}%`;
  if (wowPercent < 0) return `${wowPercent}%`;
  return '0%';
}

function formatSignupDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface SessionData {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
}

export default function AdminDashboardClient({ session }: { session: SessionData }) {
  const [waitlist, setWaitlist] = useState<WaitlistMetrics | null>(null);
  const [chrisCampaign, setChrisCampaign] = useState<ChrisCampaignMetrics | null>(null);
  const [signups, setSignups] = useState<WaitlistSignup[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [waitlistLoading, setWaitlistLoading] = useState(true);
  const [bookingExportId, setBookingExportId] = useState('');
  const [bookingExportLoading, setBookingExportLoading] = useState(false);
  const [bookingExportError, setBookingExportError] = useState<string | null>(null);
  const [bookingExportSuccess, setBookingExportSuccess] = useState<string | null>(null);

  const loadWaitlist = useCallback(async () => {
    setWaitlistLoading(true);
    setWaitlistError(null);
    try {
      const response = await fetch('/api/admin/metrics');
      const data = (await response.json()) as {
        success?: boolean;
        waitlist?: WaitlistMetrics;
        chrisCampaign?: ChrisCampaignMetrics | null;
        signups?: WaitlistSignup[];
        generatedAt?: string;
        error?: string;
      };
      if (!response.ok || !data.success || !data.waitlist || !data.signups) {
        throw new Error(data.error ?? 'Failed to load waitlist data');
      }
      setWaitlist(data.waitlist);
      setChrisCampaign(data.chrisCampaign ?? null);
      setSignups(data.signups);
      setGeneratedAt(data.generatedAt ?? null);
    } catch (error: unknown) {
      setWaitlistError(
        error instanceof Error ? error.message : 'Failed to load waitlist data',
      );
    } finally {
      setWaitlistLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadWaitlist();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loadWaitlist]);

  const handleCopyBookingBrief = useCallback(async () => {
    const bookingId = bookingExportId.trim();
    if (!bookingId) {
      setBookingExportError('Enter a booking ID.');
      setBookingExportSuccess(null);
      return;
    }

    setBookingExportLoading(true);
    setBookingExportError(null);
    setBookingExportSuccess(null);

    try {
      const response = await fetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}/export`);
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Failed to export booking brief');
      }

      const markdown = await response.text();
      try {
        await navigator.clipboard.writeText(markdown);
        setBookingExportSuccess('Brief copied to clipboard.');
      } catch {
        setBookingExportError(
          'Brief loaded but clipboard is unavailable. Use Download .md instead.',
        );
      }
    } catch (error: unknown) {
      setBookingExportError(
        error instanceof Error ? error.message : 'Failed to export booking brief',
      );
    } finally {
      setBookingExportLoading(false);
    }
  }, [bookingExportId]);

  return (
    <div className="min-h-screen bg-background text-on-surface p-6 md:p-10 font-sans selection:bg-zinc-800 selection:text-white">
      <div className="max-w-[960px] mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-outline-variant">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 text-[9px] font-mono bg-primary text-white rounded uppercase tracking-widest font-semibold">
                Ops
              </span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">
              Early access,{' '}
              <span className="font-light italic bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                {session.fullName}
              </span>
            </h1>
            <p className="text-on-surface-variant text-xs mt-1">
              Single opt-in waitlist — signups are live on submit (no confirmation email).
            </p>
          </div>

          <button
            type="button"
            onClick={() => logoutAction()}
            className="px-4 py-2 rounded-md border border-outline-variant hover:border-outline text-on-surface-variant hover:text-on-surface text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer bg-surface shadow-sm self-start"
          >
            Sign Out
          </button>
        </header>

        <div className="space-y-6">
          <CreateExpertPanel />

          <div className="p-6 rounded-md border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Waitlist metrics
              </h2>
              <button
                type="button"
                onClick={() => void loadWaitlist()}
                disabled={waitlistLoading}
                className="text-xs text-on-surface-variant hover:text-on-surface disabled:opacity-40 transition-colors"
              >
                Refresh
              </button>
            </div>
            {waitlistLoading ? (
              <p className="text-on-surface-variant text-xs font-mono">Loading waitlist…</p>
            ) : waitlistError ? (
              <p className="text-error text-xs">{waitlistError}</p>
            ) : waitlist ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-surface-container-low border border-outline-variant p-3 rounded-md">
                    <span className="text-[9px] text-on-surface-variant uppercase block tracking-widest font-mono mb-1">
                      Total
                    </span>
                    <span className="text-base font-bold text-on-surface">{waitlist.total}</span>
                  </div>
                  <div className="bg-surface-container-low border border-outline-variant p-3 rounded-md">
                    <span className="text-[9px] text-on-surface-variant uppercase block tracking-widest font-mono mb-1">
                      Last 7d
                    </span>
                    <span className="text-base font-bold text-on-surface">{waitlist.last7d}</span>
                  </div>
                  <div className="bg-surface-container-low border border-outline-variant p-3 rounded-md">
                    <span className="text-[9px] text-on-surface-variant uppercase block tracking-widest font-mono mb-1">
                      WoW
                    </span>
                    <span className="text-base font-bold text-on-surface">
                      {formatWowLabel(waitlist.wowPercent)}
                    </span>
                  </div>
                </div>
                {waitlist.topReferrers.length > 0 ? (
                  <div>
                    <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-mono mb-2">
                      Top referrers
                    </p>
                    <ul className="space-y-1 text-xs font-mono text-on-surface">
                      {waitlist.topReferrers.map((row) => (
                        <li key={row.referrer} className="flex justify-between gap-2">
                          <span className="truncate">{row.referrer}</span>
                          <span className="text-on-surface-variant shrink-0">{row.signups}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-on-surface-variant text-xs italic">
                    No referrers yet — use ?ref= on /talk-with-chris links.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {chrisCampaign ? (
            <div className="p-6 rounded-md border border-outline-variant bg-surface-container-lowest shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Chris campaign ({chrisCampaign.campaignId})
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-surface-container-low border border-outline-variant p-3 rounded-md">
                    <span className="text-[9px] text-on-surface-variant uppercase block tracking-widest font-mono mb-1">
                      Slots left
                    </span>
                    <span className="text-base font-bold text-on-surface">
                      {chrisCampaign.slotsRemaining}
                    </span>
                  </div>
                  <div className="bg-surface-container-low border border-outline-variant p-3 rounded-md">
                    <span className="text-[9px] text-on-surface-variant uppercase block tracking-widest font-mono mb-1">
                      Reserved
                    </span>
                    <span className="text-base font-bold text-on-surface">
                      {chrisCampaign.slotsReserved}/{chrisCampaign.slotCap}
                    </span>
                  </div>
                  <div className="bg-surface-container-low border border-outline-variant p-3 rounded-md">
                    <span className="text-[9px] text-on-surface-variant uppercase block tracking-widest font-mono mb-1">
                      Bookings
                    </span>
                    <span className="text-base font-bold text-on-surface">
                      {Object.values(chrisCampaign.bookingsByStatus).reduce(
                        (sum, count) => sum + count,
                        0,
                      )}
                    </span>
                  </div>
                </div>
                {Object.keys(chrisCampaign.bookingsByStatus).length > 0 ? (
                  <div>
                    <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-mono mb-2">
                      By status
                    </p>
                    <ul className="space-y-1 text-xs font-mono text-on-surface">
                      {Object.entries(chrisCampaign.bookingsByStatus).map(([status, count]) => (
                        <li key={status} className="flex justify-between gap-2">
                          <span className="truncate">{status}</span>
                          <span className="text-on-surface-variant shrink-0">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {chrisCampaign.bookingsByReferrer.length > 0 ? (
                  <div>
                    <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-mono mb-2">
                      Bookings by ref
                    </p>
                    <ul className="space-y-1 text-xs font-mono text-on-surface">
                      {chrisCampaign.bookingsByReferrer.map((row) => (
                        <li key={row.referrer} className="flex justify-between gap-2">
                          <span className="truncate">{row.referrer}</span>
                          <span className="text-on-surface-variant shrink-0">{row.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-on-surface-variant text-xs italic">
                    No Chris bookings yet — use ?ref= on /talk-with-chris links.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <div className="p-6 rounded-md border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Signups
              </h2>
              {generatedAt ? (
                <p className="text-[10px] text-on-surface-variant font-mono">
                  Updated {formatSignupDate(generatedAt)}
                </p>
              ) : null}
            </div>

            {waitlistLoading ? (
              <p className="text-on-surface-variant text-xs font-mono">Loading signups…</p>
            ) : waitlistError ? null : signups.length === 0 ? (
              <p className="text-on-surface-variant text-xs italic">No signups yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant text-[10px] uppercase tracking-wider text-on-surface-variant font-mono">
                      <th className="pb-2 pr-4 font-semibold">Email</th>
                      <th className="pb-2 pr-4 font-semibold">Signed up</th>
                      <th className="pb-2 font-semibold">Referrer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signups.map((signup) => (
                      <tr
                        key={signup.id}
                        className="border-b border-outline-variant/50 last:border-0"
                      >
                        <td className="py-2.5 pr-4 text-on-surface">{signup.email}</td>
                        <td className="py-2.5 pr-4 text-on-surface-variant text-xs whitespace-nowrap">
                          {formatSignupDate(signup.createdAt)}
                        </td>
                        <td className="py-2.5 text-on-surface-variant text-xs font-mono truncate max-w-[200px]">
                          {signup.referrer?.trim() || '(direct)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-6 rounded-md border border-outline-variant bg-surface-container-lowest shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              Booking brief export
            </h2>
            <p className="text-xs text-on-surface-variant mb-4">
              Paste a booking UUID to copy an internal Markdown brief or download a
              one-page PDF to send the expert.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={bookingExportId}
                onChange={(event) => {
                  setBookingExportId(event.target.value);
                  setBookingExportError(null);
                  setBookingExportSuccess(null);
                }}
                placeholder="Booking UUID"
                data-testid="admin-booking-export-input"
                className="flex-1 px-3 py-2 rounded-md border border-outline-variant bg-surface text-sm text-on-surface font-mono"
              />
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleCopyBookingBrief()}
                  disabled={bookingExportLoading}
                  data-testid="admin-booking-export-copy"
                  className="px-4 py-2 rounded-md bg-primary text-white text-xs font-semibold uppercase tracking-wider disabled:opacity-40 transition-opacity"
                >
                  {bookingExportLoading ? 'Loading…' : 'Copy brief'}
                </button>
                <a
                  href={
                    bookingExportId.trim()
                      ? `/api/admin/bookings/${encodeURIComponent(bookingExportId.trim())}/export?download=1`
                      : undefined
                  }
                  onClick={(event) => {
                    if (!bookingExportId.trim()) {
                      event.preventDefault();
                      setBookingExportError('Enter a booking ID.');
                      setBookingExportSuccess(null);
                    }
                  }}
                  className="px-4 py-2 rounded-md border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center"
                >
                  .md
                </a>
                <a
                  href={
                    bookingExportId.trim()
                      ? `/api/admin/bookings/${encodeURIComponent(bookingExportId.trim())}/export?format=pdf&includeEmail=false&download=1`
                      : undefined
                  }
                  onClick={(event) => {
                    if (!bookingExportId.trim()) {
                      event.preventDefault();
                      setBookingExportError('Enter a booking ID.');
                      setBookingExportSuccess(null);
                    }
                  }}
                  data-testid="admin-booking-export-pdf"
                  className="px-4 py-2 rounded-md border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center"
                >
                  PDF
                </a>
              </div>
            </div>
            {bookingExportError ? (
              <p className="text-error text-xs mt-3">{bookingExportError}</p>
            ) : null}
            {bookingExportSuccess ? (
              <p className="text-xs text-on-surface mt-3">{bookingExportSuccess}</p>
            ) : null}
          </div>

          <MentorPayoutsPanel />
        </div>
      </div>
    </div>
  );
}
