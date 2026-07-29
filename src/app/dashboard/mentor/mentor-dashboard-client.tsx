'use client';

import React, {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BriefingSidebar,
  type BriefingSidebarState,
} from '@/components/briefing/briefing-sidebar';
import type { BriefingPayload } from '@/lib/briefing-display';
import {
  changeMentorPasswordAction,
  updateMentorProfileAction,
  uploadMentorNf1860Action,
  type MentorProfileActionState,
} from '@/app/dashboard/mentor/actions';
import { FormAlert } from '@/components/forms/form-alert';
import { MentorConsultationCard } from '@/app/dashboard/mentor/mentor-consultation-card';
import {
  MentorDashboardNav,
  type MentorDashboardTab,
} from '@/app/dashboard/mentor/mentor-dashboard-nav';
import { MentorListingCard } from '@/app/dashboard/mentor/mentor-listing-card';
import { MentorOverviewPanel } from '@/app/dashboard/mentor/mentor-overview-panel';
import { MentorPageHeader } from '@/app/dashboard/mentor/mentor-page-header';
import { MentorPayoutsPanel } from '@/app/dashboard/mentor/mentor-payouts-panel';
import { MentorSettingsPanel } from '@/app/dashboard/mentor/mentor-settings-panel';
import { MentorVideoRequestsPanel } from '@/app/dashboard/mentor/mentor-video-requests-panel';
import { partitionMentorBookings, type MentorBookingView } from '@/lib/mentor-booking-partition';
import type { MentorEarningRow, MentorEarningsSummary } from '@/lib/mentor-earnings-types';
import { resolvePayoutNavStatus } from '@/lib/mentor-payouts-config';
import '@/components/dashboard/mentor-dashboard.css';

interface SessionData {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
}

type BriefingApiResponse = {
  success?: boolean;
  error?: string;
  data?: { briefing: BriefingPayload };
};

interface MentorProfileState {
  fullName: string;
  email: string;
  employer: string;
  complianceStatus: string;
  slug: string | null;
  isListed: boolean;
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
    slug: null,
    isListed: false,
    stripeOnboardingCompleted: false,
    stripeConnectAccountId: null,
    isCivilServant: false,
    bio: '',
    expertise: '',
    rate: 0,
  };
}

export default function MentorDashboardClient({
  session,
  bookings,
  mentorProfile,
  earningsSummary,
  earningsRows,
  skipStripePayments = false,
  connectPayoutsEnabled = false,
}: {
  session: SessionData;
  bookings: MentorBookingView[];
  mentorProfile: MentorProfileState | null;
  earningsSummary: MentorEarningsSummary;
  earningsRows: MentorEarningRow[];
  skipStripePayments?: boolean;
  connectPayoutsEnabled?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prepId = searchParams.get('prep');
  const handledPrepRef = useRef<string | null>(null);
  const [localBriefings, setLocalBriefings] = useState<Record<string, BriefingPayload>>({});
  const [sidebar, setSidebar] = useState<BriefingSidebarState>({ mode: 'closed' });
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MentorDashboardTab>('overview');
  const [profile, setProfile] = useState<MentorProfileState>(
    mentorProfile ?? emptyProfileFromSession(session),
  );
  const profileNeedsOnboarding = mentorProfile === null;
  const { upcoming, past, nextUpcoming } = useMemo(
    () => partitionMentorBookings(bookings),
    [bookings],
  );

  const resolveBriefing = useCallback(
    (booking: MentorBookingView): BriefingPayload | null => {
      return localBriefings[booking.id] ?? booking.briefing;
    },
    [localBriefings],
  );

  const openBriefingPanel = useCallback((booking: MentorBookingView, briefing: BriefingPayload) => {
    setSidebar({
      mode: 'ready',
      bookingId: booking.id,
      counterpartyName: booking.menteeName,
      audience: 'mentor',
      briefing,
    });
  }, []);

  const generateBriefing = useCallback(async (booking: MentorBookingView) => {
    setGeneratingId(booking.id);
    setSidebar({
      mode: 'thinking',
      bookingId: booking.id,
      counterpartyName: booking.menteeName,
      audience: 'mentor',
    });

    try {
      const res = await fetch('/api/book/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const json = (await res.json()) as BriefingApiResponse;

      if (!res.ok || !json.success || !json.data?.briefing) {
        throw new Error(json.error ?? 'Could not generate briefing');
      }

      const briefing = json.data.briefing;
      setLocalBriefings((prev) => ({ ...prev, [booking.id]: briefing }));
      setSidebar({
        mode: 'ready',
        bookingId: booking.id,
        counterpartyName: booking.menteeName,
        audience: 'mentor',
        briefing,
      });
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not generate briefing';
      setSidebar({
        mode: 'error',
        bookingId: booking.id,
        counterpartyName: booking.menteeName,
        audience: 'mentor',
        error: message,
      });
    } finally {
      setGeneratingId(null);
    }
  }, [router]);

  function handleViewPrepBrief(booking: MentorBookingView) {
    const briefing = resolveBriefing(booking);
    if (briefing) {
      openBriefingPanel(booking, briefing);
      return;
    }
    void generateBriefing(booking);
  }

  const [profileState, profileAction, profilePending] = useActionState<
    MentorProfileActionState | undefined,
    FormData
  >(updateMentorProfileAction, undefined);

  const [uploadState, uploadAction, uploadPending] = useActionState<
    MentorProfileActionState | undefined,
    FormData
  >(uploadMentorNf1860Action, undefined);

  const [passwordState, passwordAction, passwordPending] = useActionState<
    MentorProfileActionState | undefined,
    FormData
  >(changeMentorPasswordAction, undefined);
  const passwordFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (mentorProfile) {
      const frame = window.requestAnimationFrame(() => setProfile(mentorProfile));
      return () => window.cancelAnimationFrame(frame);
    }
    return undefined;
  }, [mentorProfile]);

  useEffect(() => {
    if (profileState?.success || uploadState?.success) {
      router.refresh();
    }
  }, [profileState?.success, uploadState?.success, router]);

  useEffect(() => {
    if (passwordState?.success) {
      passwordFormRef.current?.reset();
    }
  }, [passwordState?.success]);

  useEffect(() => {
    if (!prepId || handledPrepRef.current === prepId) {
      return;
    }

    const booking = bookings.find((b) => b.id === prepId);
    if (!booking) {
      return;
    }

    handledPrepRef.current = prepId;
    const frame = window.requestAnimationFrame(() => {
      setActiveTab('sessions');
      const briefing = localBriefings[booking.id] ?? booking.briefing;
      if (briefing) {
        openBriefingPanel(booking, briefing);
      } else {
        void generateBriefing(booking);
      }
      document
        .querySelector(`[data-testid="mentor-booking-${prepId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      router.replace('/dashboard/mentor', { scroll: false });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [prepId, bookings, generateBriefing, localBriefings, openBriefingPanel, router]);

  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set('rate', String(profile.rate));
    formData.set('employer', profile.employer);
    formData.set('expertise', profile.expertise);
    formData.set('bio', profile.bio);
    if (profile.isCivilServant) {
      formData.set('isCivilServant', 'on');
    }
    startTransition(() => {
      profileAction(formData);
    });
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.set('file', file);
    startTransition(() => {
      uploadAction(formData);
    });
    e.target.value = '';
  };

  const pdfUploaded =
    uploadState?.success ||
    (profile.isCivilServant &&
      profile.complianceStatus !== 'document_required' &&
      profile.complianceStatus !== 'stripe_incomplete');

  const payoutNavStatus = resolvePayoutNavStatus({
    skipStripePayments,
    connectPayoutsEnabled,
    stripeOnboardingCompleted: profile.stripeOnboardingCompleted,
  });

  const firstName = profile.fullName.split(' ')[0] || profile.fullName;
  const expertInitials = profile.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';
  const profileComplete =
    !profileNeedsOnboarding &&
    profile.bio.trim().length >= 10 &&
    profile.employer.trim().length >= 2 &&
    profile.expertise.trim().length >= 2 &&
    profile.rate > 0;
  const hasUpcoming = upcoming.length > 0;
  const payoutReady =
    payoutNavStatus === 'connected' ||
    payoutNavStatus === 'manual' ||
    payoutNavStatus === 'dev_skip';
  const setupSteps = [
    { key: 'profile', done: profileComplete, label: 'Profile' },
    { key: 'payout', done: payoutReady, label: 'Payouts' },
    { key: 'session', done: hasUpcoming || past.length > 0, label: 'Sessions' },
  ] as const;
  const setupFilled = setupSteps.filter((s) => s.done).length;
  const showSetupBar = setupFilled < setupSteps.length;

  return (
    <>
    <div className="mentor-dash">
      <MentorDashboardNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        payoutNavStatus={payoutNavStatus}
        expertName={profile.fullName}
        expertInitials={expertInitials}
        upcomingCount={upcoming.length}
      />

      <div className={activeTab === 'settings' ? 'md-shell md-shell-settings' : 'md-shell'}>
        <div className="md-shell-inner">
        {showSetupBar && activeTab !== 'settings' && activeTab !== 'overview' ? (
          <div className="md-setup" data-testid="mentor-setup-progress">
            <p className="md-setup-label">Getting set up</p>
            <div className="md-segments" aria-hidden="true">
              {setupSteps.map((s) => (
                <div
                  key={s.key}
                  className={s.done ? 'md-segment md-segment-on' : 'md-segment md-segment-off'}
                />
              ))}
            </div>
            <p className="md-setup-copy">
              {setupSteps
                .map((s) => `${s.label}${s.done ? ' ✓' : ''}`)
                .join(' · ')}
              {profileNeedsOnboarding
                ? ' — finish your profile so buyers see accurate details.'
                : !hasUpcoming && past.length === 0
                  ? ' — when a buyer books you, the session shows up here.'
                  : ''}
            </p>
          </div>
        ) : null}

          <main>
            {activeTab === 'overview' && (
              <MentorOverviewPanel
                firstName={firstName}
                nextSession={nextUpcoming}
                upcoming={upcoming.map((b) => ({
                  ...b,
                  briefing: resolveBriefing(b),
                }))}
                pastCount={past.length}
                earningsSummary={earningsSummary}
                payoutNavStatus={payoutNavStatus}
                listing={{
                  complianceStatus: profile.complianceStatus,
                  isListed: profile.isListed,
                  slug: profile.slug,
                }}
                profileComplete={profileComplete}
                setupSteps={setupSteps}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'videos' && <MentorVideoRequestsPanel />}

            {activeTab === 'sessions' && (
              <div className="md-stack" data-testid="mentor-consultations-tab">
                <MentorPageHeader
                  as="h2"
                  title="Sessions"
                  description="Upcoming and past consultations with prep context."
                  meta={`${upcoming.length} upcoming · ${past.length} past`}
                />

                {bookings.length === 0 ? (
                  <p className="md-empty">
                    No sessions yet. When a buyer books you, they appear here with goals and
                    briefing context.
                  </p>
                ) : (
                  <>
                    <section className="md-stack-tight" data-testid="mentor-upcoming-section">
                      <h3 className="md-section-label">Upcoming</h3>
                      {upcoming.length === 0 ? (
                        <p className="md-empty">No upcoming sessions.</p>
                      ) : (
                        <div className="md-stack-tight">
                          {upcoming.map((booking) => (
                            <MentorConsultationCard
                              key={booking.id}
                              booking={{
                                ...booking,
                                briefing: resolveBriefing(booking),
                              }}
                              mentorName={profile.fullName}
                              onViewPrepBrief={handleViewPrepBrief}
                              prepBriefGenerating={generatingId === booking.id}
                            />
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="md-stack-tight" data-testid="mentor-past-section">
                      <h3 className="md-section-label">Past</h3>
                      {past.length === 0 ? (
                        <p className="md-empty">No past sessions.</p>
                      ) : (
                        <div className="md-stack-tight">
                          {past.map((booking) => (
                            <MentorConsultationCard
                              key={booking.id}
                              booking={booking}
                              compact
                              mentorName={profile.fullName}
                            />
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
                connectPayoutsEnabled={connectPayoutsEnabled}
              />
            )}

            {activeTab === 'profile' && (
              <div className="md-stack">
                <MentorPageHeader
                  as="h2"
                  title="Listing"
                  description="Information shown to buyers on your expert listing."
                />

                <MentorListingCard
                  complianceStatus={profile.complianceStatus}
                  isListed={profile.isListed}
                  slug={profile.slug}
                />

                <form
                  onSubmit={handleSaveProfile}
                  className="md-field-stack md-form-col"
                  data-testid="mentor-profile-form"
                >
                  {profileState?.success ? (
                    <p
                      className="md-empty"
                      data-testid="mentor-profile-success"
                    >
                      {profileState.message ?? 'Profile saved.'}
                    </p>
                  ) : null}
                  {profileState?.message && !profileState.success ? (
                    <FormAlert message={profileState.message} />
                  ) : null}

                  <div className="md-field-grid md-field-grid-2">
                    <div>
                      <label htmlFor="mentor-profile-rate" className="md-label">
                        Hourly rate (USD)
                      </label>
                      <input
                        id="mentor-profile-rate"
                        type="number"
                        required
                        min={1}
                        value={profile.rate}
                        onChange={(e) => setProfile({ ...profile, rate: Number(e.target.value) })}
                        className="md-input"
                      />
                    </div>
                    <div>
                      <label htmlFor="mentor-profile-employer" className="md-label">
                        Employer
                      </label>
                      <input
                        id="mentor-profile-employer"
                        type="text"
                        required
                        value={profile.employer}
                        onChange={(e) => setProfile({ ...profile, employer: e.target.value })}
                        className="md-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="mentor-profile-expertise" className="md-label">
                      Expertise (comma-separated)
                    </label>
                    <input
                      id="mentor-profile-expertise"
                      type="text"
                      required
                      value={profile.expertise}
                      onChange={(e) => setProfile({ ...profile, expertise: e.target.value })}
                      className="md-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="mentor-profile-bio" className="md-label">
                      Bio
                    </label>
                    <textarea
                      id="mentor-profile-bio"
                      rows={5}
                      required
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className="md-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profilePending}
                    className="md-btn-primary"
                  >
                    {profilePending ? 'Saving…' : 'Save profile'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'settings' && (
              <MentorSettingsPanel
                fullName={profile.fullName}
                email={profile.email}
                payoutNavStatus={payoutNavStatus}
                isCivilServant={profile.isCivilServant}
                onCivilServantChange={(checked) => {
                  const next = {
                    ...profile,
                    isCivilServant: checked,
                    complianceStatus:
                      checked && !pdfUploaded
                        ? 'document_required'
                        : profile.complianceStatus,
                  };
                  setProfile(next);
                  const formData = new FormData();
                  formData.set('rate', String(next.rate));
                  formData.set('employer', next.employer);
                  formData.set('expertise', next.expertise);
                  formData.set('bio', next.bio);
                  if (checked) {
                    formData.set('isCivilServant', 'on');
                  }
                  startTransition(() => {
                    profileAction(formData);
                  });
                }}
                pdfUploaded={!!pdfUploaded}
                uploadPending={uploadPending}
                uploadState={uploadState}
                onPdfUpload={handlePdfUpload}
                passwordFormRef={passwordFormRef}
                passwordAction={passwordAction}
                passwordState={passwordState}
                passwordPending={passwordPending}
              />
            )}

          </main>
        </div>
      </div>
    </div>

    <BriefingSidebar
      state={sidebar}
      onClose={() => setSidebar({ mode: 'closed' })}
      onRegenerate={
        sidebar.mode !== 'closed'
          ? () => {
              const booking = bookings.find((b) => b.id === sidebar.bookingId);
              if (booking) {
                void generateBriefing(booking);
              }
            }
          : undefined
      }
    />
    </>
  );
}
