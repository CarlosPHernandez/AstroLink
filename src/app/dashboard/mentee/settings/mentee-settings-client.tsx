'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { logoutAction } from '@/app/auth/actions';
import {
  updateProfileAction,
  type SettingsActionState,
} from '@/app/dashboard/mentee/settings/actions';
import type { MenteeProfile } from '@/lib/user-profile';

interface SessionData {
  userId: string;
  email: string;
  role: 'mentee';
  fullName: string;
}

type SettingsTab = 'profile' | 'payment';

export default function MenteeSettingsClient({
  profile,
  skipPayments,
}: {
  session: SessionData;
  profile: MenteeProfile;
  skipPayments: boolean;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState<SettingsActionState | undefined, FormData>(
    updateProfileAction,
    undefined,
  );

  async function openBillingPortal() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch('/api/settings/billing-portal', { method: 'POST' });
      const json = (await res.json()) as { success?: boolean; url?: string; error?: string };
      if (!res.ok || !json.success || !json.url) {
        throw new Error(json.error ?? 'Could not open billing portal');
      }
      window.location.href = json.url;
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Could not open billing portal');
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-outline-variant">
          <div>
            <p className="text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-1">
              Account
            </p>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Settings</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/mentee"
              className="px-4 py-2 rounded-md border border-outline-variant hover:border-outline text-on-surface-variant hover:text-on-surface text-xs font-semibold uppercase tracking-wider transition-all bg-surface shadow-sm"
            >
              Back to sessions
            </Link>
            <button
              type="button"
              onClick={() => logoutAction()}
              className="px-4 py-2 rounded-md border border-outline-variant hover:border-outline text-on-surface-variant hover:text-on-surface text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer bg-surface shadow-sm"
            >
              Sign out
            </button>
          </div>
        </header>

        <div className="flex gap-2 mb-8 border-b border-outline-variant">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            data-testid="settings-tab-profile"
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-primary text-on-surface'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            data-testid="settings-tab-payment"
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'payment'
                ? 'border-primary text-on-surface'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Payment
          </button>
        </div>

        {activeTab === 'profile' ? (
          <div className="border border-outline-variant rounded-md bg-surface-container-lowest p-6 shadow-sm">
            {state?.success ? (
              <p
                className="mb-4 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2"
                data-testid="settings-profile-success"
              >
                {state.message ?? 'Profile saved.'}
              </p>
            ) : null}
            {state?.message && !state.success ? (
              <p className="mb-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {state.message}
              </p>
            ) : null}

            <form action={formAction} className="space-y-5" data-testid="settings-profile-form">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-1.5"
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  required
                  defaultValue={profile.fullName}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary rounded-md text-sm text-on-surface focus:outline-none"
                />
                {state?.errors?.fullName ? (
                  <p className="mt-1 text-[11px] text-red-600">{state.errors.fullName[0]}</p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={profile.email}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary rounded-md text-sm text-on-surface focus:outline-none"
                />
                {state?.errors?.email ? (
                  <p className="mt-1 text-[11px] text-red-600">{state.errors.email[0]}</p>
                ) : null}
                <p className="mt-1 text-[10px] text-on-surface-variant font-light">
                  Email updates apply to your account immediately. Verification is not required in
                  this preview build.
                </p>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-1.5"
                >
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+14155552671"
                  defaultValue={profile.phone ?? ''}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary rounded-md text-sm text-on-surface focus:outline-none"
                />
                {state?.errors?.phone ? (
                  <p className="mt-1 text-[11px] text-red-600">{state.errors.phone[0]}</p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="block text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-1.5"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  defaultValue={profile.bio}
                  placeholder="A short note experts can use to understand your background."
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary rounded-md text-sm text-on-surface focus:outline-none resize-none leading-relaxed"
                />
                {state?.errors?.bio ? (
                  <p className="mt-1 text-[11px] text-red-600">{state.errors.bio[0]}</p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={pending}
                className="w-full py-2.5 bg-primary hover:bg-primary-container disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider rounded-md cursor-pointer shadow-sm"
              >
                {pending ? 'Saving…' : 'Save profile'}
              </button>
            </form>
          </div>
        ) : (
          <div
            className="border border-outline-variant rounded-md bg-surface-container-lowest p-6 shadow-sm space-y-4"
            data-testid="settings-payment-panel"
          >
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Add or update the card used for expert session checkout. Payments are processed
              securely through Stripe.
            </p>

            {skipPayments ? (
              <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900">
                Stripe is disabled locally (<code className="font-mono">SKIP_STRIPE_PAYMENTS=true</code>
                ). Payment methods cannot be managed until you use live Stripe keys and turn skip
                mode off.
              </div>
            ) : (
              <>
                {profile.stripeCustomerId ? (
                  <p className="text-[10px] font-mono text-on-surface-variant">
                    Payment profile on file
                  </p>
                ) : (
                  <p className="text-[10px] text-on-surface-variant">
                    No saved card yet. Open the portal to add one before your next booking.
                  </p>
                )}
                {portalError ? (
                  <p className="text-xs text-red-600">{portalError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => openBillingPortal()}
                  disabled={portalLoading}
                  data-testid="settings-manage-payment"
                  className="px-5 py-2.5 rounded-md bg-primary hover:bg-primary-container disabled:opacity-50 text-white font-semibold text-xs uppercase tracking-wider cursor-pointer shadow-sm"
                >
                  {portalLoading ? 'Opening…' : 'Manage payment methods'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
