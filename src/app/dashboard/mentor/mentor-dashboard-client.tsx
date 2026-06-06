'use client';

import React, { useMemo, useState } from 'react';
import { logoutAction } from '@/app/auth/actions';
import { MentorConsultationCard } from '@/app/dashboard/mentor/mentor-consultation-card';
import {
  MentorDashboardNav,
  type MentorDashboardTab,
} from '@/app/dashboard/mentor/mentor-dashboard-nav';
import { MentorPayoutsPanel } from '@/app/dashboard/mentor/mentor-payouts-panel';
import { partitionMentorBookings, type MentorBookingView } from '@/lib/mentor-booking-partition';
import type { MentorEarningRow, MentorEarningsSummary } from '@/lib/mentor-earnings-types';

interface SessionData {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
}

interface MentorProfileState {
  fullName: string;
  email: string;
  employer: string;
  complianceStatus: string;
  stripeOnboardingCompleted: boolean;
  stripeConnectAccountId: string | null;
  isCivilServant: boolean;
  bio: string;
  expertise: string;
  rate: number;
}

function emptyProfileFromSession(session: SessionData): MentorProfileState {
  return {
    fullName: session.fullName,
    email: session.email,
    employer: '',
    complianceStatus: 'stripe_incomplete',
    stripeOnboardingCompleted: false,
    stripeConnectAccountId: null,
    isCivilServant: false,
    bio: '',
    expertise: '',
    rate: 0,
  };
}

function complianceLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

export default function MentorDashboardClient({
  session,
  bookings,
  mentorProfile,
  earningsSummary,
  earningsRows,
  skipStripePayments = false,
}: {
  session: SessionData;
  bookings: MentorBookingView[];
  mentorProfile: MentorProfileState | null;
  earningsSummary: MentorEarningsSummary;
  earningsRows: MentorEarningRow[];
  skipStripePayments?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<MentorDashboardTab>('sessions');
  const [profile, setProfile] = useState<MentorProfileState>(
    mentorProfile ?? emptyProfileFromSession(session),
  );
  const profileNeedsOnboarding = mentorProfile === null;
  const { upcoming, past } = useMemo(() => partitionMentorBookings(bookings), [bookings]);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Profile saved.');
    }, 800);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setUploading(true);
      setTimeout(() => {
        setUploading(false);
        setPdfUploaded(true);
        if (profile.stripeOnboardingCompleted) {
          setProfile((prev) => ({ ...prev, complianceStatus: 'awaiting_human_approval' }));
        }
        alert('Document uploaded for compliance review.');
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 text-on-surface md:p-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-col justify-between gap-6 border-b border-outline-variant pb-6 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
              Mentor dashboard
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-on-surface">
              Hello, {profile.fullName}
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Manage sessions, earnings, and your public expert profile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md border border-outline-variant bg-surface px-3 py-1.5 text-xs text-on-surface-variant">
              Status:{' '}
              <span className="font-medium text-on-surface">
                {complianceLabel(profile.complianceStatus)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => logoutAction()}
              className="cursor-pointer rounded-md border border-outline-variant bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Sign out
            </button>
          </div>
        </header>

        {profileNeedsOnboarding ? (
          <div className="mb-8 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Complete your mentor profile and connect payouts to appear in the public roster and
            accept bookings.
          </div>
        ) : null}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <MentorDashboardNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            stripeReady={profile.stripeOnboardingCompleted || skipStripePayments}
          />

          <main className="lg:col-span-9">
            {activeTab === 'sessions' && (
              <div className="space-y-8" data-testid="mentor-consultations-tab">
                <header className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-on-surface">Sessions</h2>
                  <p className="text-xs text-on-surface-variant">
                    {upcoming.length} upcoming · {past.length} past
                  </p>
                </header>

                {bookings.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">
                    No sessions yet. When a buyer books you, they appear here with goals and
                    briefing context.
                  </p>
                ) : (
                  <>
                    <section data-testid="mentor-upcoming-section">
                      <h3 className="mb-3 text-sm font-medium text-on-surface-variant">Upcoming</h3>
                      {upcoming.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">No upcoming sessions.</p>
                      ) : (
                        <div className="space-y-4">
                          {upcoming.map((booking) => (
                            <MentorConsultationCard key={booking.id} booking={booking} />
                          ))}
                        </div>
                      )}
                    </section>

                    <section data-testid="mentor-past-section">
                      <h3 className="mb-3 text-sm font-medium text-on-surface-variant">Past</h3>
                      {past.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">No past sessions.</p>
                      ) : (
                        <div className="space-y-4">
                          {past.map((booking) => (
                            <MentorConsultationCard key={booking.id} booking={booking} compact />
                          ))}
                        </div>
                      )}
                    </section>
                  </>
                )}
              </div>
            )}

            {activeTab === 'earnings' && (
              <MentorPayoutsPanel
                summary={earningsSummary}
                rows={earningsRows}
                hourlyRateDollars={profile.rate}
                stripeOnboardingCompleted={profile.stripeOnboardingCompleted}
                stripeConnectAccountId={profile.stripeConnectAccountId}
                skipStripePayments={skipStripePayments}
              />
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <header>
                  <h2 className="text-lg font-semibold text-on-surface">Profile</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Information shown to buyers on your expert listing.
                  </p>
                </header>

                <form
                  onSubmit={handleSaveProfile}
                  className="space-y-5 rounded-lg border border-outline-variant bg-surface p-6"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">
                        Hourly rate (USD)
                      </label>
                      <input
                        type="number"
                        required
                        value={profile.rate}
                        onChange={(e) => setProfile({ ...profile, rate: Number(e.target.value) })}
                        className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">
                        Employer
                      </label>
                      <input
                        type="text"
                        required
                        value={profile.employer}
                        onChange={(e) => setProfile({ ...profile, employer: e.target.value })}
                        className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">
                      Expertise (comma-separated)
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.expertise}
                      onChange={(e) => setProfile({ ...profile, expertise: e.target.value })}
                      className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">
                      Bio
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className="w-full resize-none rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm leading-relaxed text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-outline-variant bg-surface-container-low/50 p-4">
                    <div>
                      <p className="text-sm font-medium text-on-surface">Federal civil servant</p>
                      <p className="text-xs text-on-surface-variant">
                        Requires NASA Form NF-1860 approval for outside consulting.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.isCivilServant}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setProfile((prev) => ({
                          ...prev,
                          isCivilServant: checked,
                          complianceStatus:
                            checked && !pdfUploaded ? 'document_required' : prev.complianceStatus,
                        }));
                      }}
                      className="h-4 w-4 cursor-pointer rounded border-outline-variant text-primary focus:ring-primary"
                    />
                  </div>

                  {profile.isCivilServant ? (
                    <div className="space-y-2 rounded-md border border-outline-variant bg-surface-container-low p-4">
                      <p className="text-xs font-medium text-on-surface-variant">
                        NF-1860 upload
                      </p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        className="w-full text-sm text-on-surface-variant file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-outline-variant file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase"
                      />
                      {uploading ? (
                        <p className="text-xs text-on-surface-variant">Uploading…</p>
                      ) : null}
                      {pdfUploaded ? (
                        <p className="text-xs font-medium text-emerald-700">Document received.</p>
                      ) : null}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full cursor-pointer rounded-md bg-primary py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-primary-container disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save profile'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="rounded-lg border border-outline-variant bg-surface p-6">
                <h2 className="text-lg font-semibold text-on-surface">Session reports</h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Briefing summaries and compliance notes will appear here after you complete live
                  sessions.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
