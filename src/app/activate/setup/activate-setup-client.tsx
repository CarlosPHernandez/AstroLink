'use client';

import React, { useActionState, useState } from 'react';
import {
  completeActivationAction,
  saveActivationProfileAction,
  savePayoutPreferenceAction,
  type ActivateActionState,
} from '@/app/activate/actions';
import { FieldError } from '@/components/forms/field-error';
import { FormAlert } from '@/components/forms/form-alert';
import { fieldErrorInputClass } from '@/lib/zod-field-errors';

type Profile = {
  fullName: string;
  email: string;
  title: string;
  employer: string;
  expertise: string;
  bio: string;
  rate: number;
  payoutMethod: string;
  payoutHandle: string;
};

const inputClass =
  'w-full py-sm px-md font-body-md text-body-md bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary';

export function ActivateSetupClient({
  session,
  profile: initial,
}: {
  session: { userId: string; email: string; fullName: string };
  profile: Profile;
}) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(initial);

  const [profileState, profileAction, profilePending] = useActionState<
    ActivateActionState | undefined,
    FormData
  >(async (prev, formData) => {
    const result = await saveActivationProfileAction(prev, formData);
    if (result.success) {
      setProfile((p) => ({
        ...p,
        fullName: String(formData.get('fullName') ?? p.fullName),
        title: String(formData.get('title') ?? p.title),
        employer: String(formData.get('employer') ?? p.employer),
        expertise: String(formData.get('expertise') ?? p.expertise),
        bio: String(formData.get('bio') ?? p.bio),
        rate: Number(formData.get('rate') ?? p.rate),
      }));
      setStep(3);
    }
    return result;
  }, undefined);

  const [payoutState, payoutAction, payoutPending] = useActionState<
    ActivateActionState | undefined,
    FormData
  >(async (prev, formData) => {
    const result = await savePayoutPreferenceAction(prev, formData);
    if (result.success) {
      setStep(4);
    }
    return result;
  }, undefined);

  const [completeState, setCompleteState] = useState<ActivateActionState | undefined>();
  const [completePending, setCompletePending] = useState(false);

  const onComplete = async () => {
    setCompletePending(true);
    setCompleteState(undefined);
    const result = await completeActivationAction();
    setCompleteState(result);
    setCompletePending(false);
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col items-center p-4 py-10">
      <main className="w-full max-w-xl space-y-6" data-testid="activate-setup">
        <header className="text-center space-y-2">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
            Step {Math.min(step + 1, 5)} of 5
          </p>
          <h1 className="font-headline-md text-headline-md font-bold">
            Confirm your expert profile
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Review what we preloaded for you. You can edit anything before finishing.
          </p>
        </header>

        <div className="border border-outline-variant rounded-xl p-5 sm:p-8 bg-surface-container-lowest shadow-sm">
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-body-md text-on-surface-variant">
                Welcome, {session.fullName || profile.fullName}. Your sessions and profile
                are already set up — this short setup makes sure everything looks right.
              </p>
              <button
                type="button"
                className="w-full py-sm px-md bg-primary text-on-primary font-label-md rounded-lg"
                onClick={() => setStep(1)}
                data-testid="activate-welcome-continue"
              >
                Continue
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">Identity</h2>
              <div>
                <label className="block text-label-sm mb-1" htmlFor="fullName">
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-label-sm mb-1">Signed in as</label>
                <input
                  type="email"
                  readOnly
                  value={profile.email || session.email}
                  className={`${inputClass} bg-surface-container-low cursor-not-allowed`}
                />
              </div>
              <div className="flex gap-2">
                <button type="button" className="flex-1 border border-outline-variant rounded-lg py-2" onClick={() => setStep(0)}>
                  Back
                </button>
                <button
                  type="button"
                  className="flex-1 bg-primary text-on-primary rounded-lg py-2 font-label-md"
                  onClick={() => setStep(2)}
                  data-testid="activate-identity-continue"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form id="profile-form" action={profileAction} className="space-y-4">
              <h2 className="text-sm font-semibold">Profile</h2>
              {profileState?.message && !profileState.success ? (
                <FormAlert message={profileState.message} />
              ) : null}
              <input type="hidden" name="fullName" value={profile.fullName} />
              <div>
                <label className="block text-label-sm mb-1" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  defaultValue={profile.title}
                  className={fieldErrorInputClass(!!profileState?.errors?.title, inputClass)}
                />
              </div>
              <div>
                <label className="block text-label-sm mb-1" htmlFor="employer">
                  Employer / institution
                </label>
                <input
                  id="employer"
                  name="employer"
                  required
                  defaultValue={profile.employer}
                  className={fieldErrorInputClass(!!profileState?.errors?.employer, inputClass)}
                />
                <FieldError message={profileState?.errors?.employer?.[0]} />
              </div>
              <div>
                <label className="block text-label-sm mb-1" htmlFor="expertise">
                  Expertise (comma-separated)
                </label>
                <input
                  id="expertise"
                  name="expertise"
                  required
                  defaultValue={profile.expertise}
                  className={fieldErrorInputClass(!!profileState?.errors?.expertise, inputClass)}
                />
                <FieldError message={profileState?.errors?.expertise?.[0]} />
              </div>
              <div>
                <label className="block text-label-sm mb-1" htmlFor="bio">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  required
                  rows={5}
                  defaultValue={profile.bio}
                  className={fieldErrorInputClass(!!profileState?.errors?.bio, inputClass)}
                />
                <FieldError message={profileState?.errors?.bio?.[0]} />
              </div>
              <div>
                <label className="block text-label-sm mb-1" htmlFor="rate">
                  Hourly rate (USD)
                </label>
                <input
                  id="rate"
                  name="rate"
                  type="number"
                  min={0}
                  required
                  defaultValue={profile.rate}
                  className={fieldErrorInputClass(!!profileState?.errors?.rate, inputClass)}
                />
                <FieldError message={profileState?.errors?.rate?.[0]} />
              </div>
              <div className="flex gap-2">
                <button type="button" className="flex-1 border border-outline-variant rounded-lg py-2" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  type="submit"
                  disabled={profilePending}
                  className="flex-1 bg-primary text-on-primary rounded-lg py-2 font-label-md disabled:opacity-50"
                  data-testid="activate-profile-save"
                >
                  {profilePending ? 'Saving…' : 'Save & continue'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form action={payoutAction} className="space-y-4">
              <h2 className="text-sm font-semibold">Payout preference</h2>
              <p className="text-label-sm text-on-surface-variant">
                Optional. We pay experts manually for now — this tells ops where to send funds.
              </p>
              {payoutState?.message && !payoutState.success ? (
                <FormAlert message={payoutState.message} />
              ) : null}
              <fieldset className="space-y-2">
                {(
                  [
                    ['paypal', 'PayPal'],
                    ['zelle', 'Zelle'],
                    ['cashapp', 'Cash App'],
                    ['bank_manual', 'Bank transfer (ops will follow up)'],
                    ['unset', 'Skip for now'],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="payoutMethod"
                      value={value}
                      defaultChecked={profile.payoutMethod === value || (!profile.payoutMethod && value === 'unset')}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <div>
                <label className="block text-label-sm mb-1" htmlFor="payoutHandle">
                  Account email / phone / username
                </label>
                <input
                  id="payoutHandle"
                  name="payoutHandle"
                  defaultValue={profile.payoutHandle}
                  placeholder="Only needed for PayPal, Zelle, or Cash App"
                  className={fieldErrorInputClass(!!payoutState?.errors?.payoutHandle, inputClass)}
                />
                <FieldError message={payoutState?.errors?.payoutHandle?.[0]} />
              </div>
              <div className="flex gap-2">
                <button type="button" className="flex-1 border border-outline-variant rounded-lg py-2" onClick={() => setStep(2)}>
                  Back
                </button>
                <button
                  type="submit"
                  disabled={payoutPending}
                  className="flex-1 bg-primary text-on-primary rounded-lg py-2 font-label-md disabled:opacity-50"
                  data-testid="activate-payout-save"
                >
                  {payoutPending ? 'Saving…' : 'Continue'}
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center">
              <h2 className="text-sm font-semibold">You&apos;re ready</h2>
              <p className="text-body-md text-on-surface-variant">
                Head to your dashboard to see sessions and manage your profile anytime.
              </p>
              {completeState?.message ? <FormAlert message={completeState.message} /> : null}
              <button
                type="button"
                disabled={completePending}
                onClick={() => void onComplete()}
                className="w-full py-sm px-md bg-primary text-on-primary font-label-md rounded-lg disabled:opacity-50"
                data-testid="activate-complete"
              >
                {completePending ? 'Finishing…' : 'Go to dashboard'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
