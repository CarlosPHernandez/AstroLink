'use client';

import React, { useActionState, useState } from 'react';
import {
  completeActivationAction,
  saveActivationProfileAction,
  savePayoutPreferenceAction,
  type ActivateActionState,
} from '@/app/activate/actions';
import {
  ActivateBrandHeader,
  ActivateCard,
  ActivatePageFrame,
  ActivateStepProgress,
  activateInputClass,
  activatePrimaryBtnClass,
  activateSecondaryBtnClass,
} from '@/components/activate/activate-shell';
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

const PAYOUT_OPTIONS = [
  { value: 'paypal', label: 'PayPal' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'cashapp', label: 'Cash App' },
  { value: 'bank_manual', label: 'Bank transfer (ops will follow up)' },
  { value: 'unset', label: 'Skip for now' },
] as const;

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label className="activate-label" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function StepNav({
  onBack,
  children,
}: {
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="activate-nav">
      {onBack ? (
        <button type="button" className={activateSecondaryBtnClass} onClick={onBack}>
          Back
        </button>
      ) : (
        <span className="hidden sm:block" />
      )}
      <div className="w-full sm:w-auto sm:min-w-[12rem]">{children}</div>
    </div>
  );
}

export function ActivateSetupClient({
  session,
  profile: initial,
}: {
  session: { userId: string; email: string; fullName: string };
  profile: Profile;
}) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(initial);
  const [payoutMethod, setPayoutMethod] = useState(
    initial.payoutMethod && initial.payoutMethod !== ''
      ? initial.payoutMethod
      : 'unset',
  );

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

  const firstName = (session.fullName || profile.fullName).split(' ')[0] || 'there';

  return (
    <ActivatePageFrame>
      <div data-testid="activate-setup">
        <ActivateBrandHeader
          title="Confirm your expert profile"
          subtitle="Review what we preloaded. Edit anything before you finish."
        />
        <ActivateStepProgress currentStep={step} />
        <ActivateCard>
          {step === 0 && (
            <div>
              <h2 className="activate-section-title">Welcome, {firstName}</h2>
              <p className="activate-section-copy">
                Your sessions and public profile are already set up. Next you will confirm your
                name, profile details, rate, and optional payout preference.
              </p>
              <StepNav>
                <button
                  type="button"
                  className={activatePrimaryBtnClass}
                  onClick={() => setStep(1)}
                  data-testid="activate-welcome-continue"
                >
                  Get started
                </button>
              </StepNav>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="activate-section-title">Identity</h2>
              <p className="activate-section-copy">
                How you appear on AstroLink. Sign-in email is locked to this invite.
              </p>
              <div className="activate-field-stack mt-8">
                <div>
                  <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                  <input
                    id="fullName"
                    name="fullName"
                    value={profile.fullName}
                    onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                    required
                    className={activateInputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Signed in as</FieldLabel>
                  <input
                    type="email"
                    readOnly
                    value={profile.email || session.email}
                    className={`${activateInputClass} activate-input-readonly`}
                  />
                </div>
              </div>
              <StepNav onBack={() => setStep(0)}>
                <button
                  type="button"
                  className={activatePrimaryBtnClass}
                  onClick={() => setStep(2)}
                  data-testid="activate-identity-continue"
                >
                  Continue
                </button>
              </StepNav>
            </div>
          )}

          {step === 2 && (
            <form action={profileAction}>
              <h2 className="activate-section-title">Profile</h2>
              <p className="activate-section-copy">
                Shown to buyers on your expert listing. Edit anything that looks off.
              </p>
              {profileState?.message && !profileState.success ? (
                <div className="mt-6">
                  <FormAlert message={profileState.message} />
                </div>
              ) : null}
              <input type="hidden" name="fullName" value={profile.fullName} />
              <div className="activate-field-stack activate-field-grid activate-field-grid-2 mt-8">
                <div>
                  <FieldLabel htmlFor="title">Title</FieldLabel>
                  <input
                    id="title"
                    name="title"
                    defaultValue={profile.title}
                    placeholder="e.g. Aerospace engineer"
                    className={fieldErrorInputClass(!!profileState?.errors?.title, activateInputClass)}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="employer">Employer / institution</FieldLabel>
                  <input
                    id="employer"
                    name="employer"
                    required
                    defaultValue={profile.employer}
                    className={fieldErrorInputClass(
                      !!profileState?.errors?.employer,
                      activateInputClass,
                    )}
                  />
                  <FieldError message={profileState?.errors?.employer?.[0]} />
                </div>
                <div className="sm:col-span-2" style={{ gridColumn: '1 / -1' }}>
                  <FieldLabel htmlFor="expertise">Expertise (comma-separated)</FieldLabel>
                  <input
                    id="expertise"
                    name="expertise"
                    required
                    defaultValue={profile.expertise}
                    className={fieldErrorInputClass(
                      !!profileState?.errors?.expertise,
                      activateInputClass,
                    )}
                  />
                  <FieldError message={profileState?.errors?.expertise?.[0]} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <FieldLabel htmlFor="bio">Bio</FieldLabel>
                  <textarea
                    id="bio"
                    name="bio"
                    required
                    rows={5}
                    defaultValue={profile.bio}
                    className={fieldErrorInputClass(
                      !!profileState?.errors?.bio,
                      activateInputClass,
                    )}
                  />
                  <FieldError message={profileState?.errors?.bio?.[0]} />
                </div>
                <div>
                  <FieldLabel htmlFor="rate">Hourly rate (USD)</FieldLabel>
                  <input
                    id="rate"
                    name="rate"
                    type="number"
                    min={0}
                    required
                    defaultValue={profile.rate}
                    className={fieldErrorInputClass(
                      !!profileState?.errors?.rate,
                      activateInputClass,
                    )}
                  />
                  <FieldError message={profileState?.errors?.rate?.[0]} />
                </div>
              </div>
              <StepNav onBack={() => setStep(1)}>
                <button
                  type="submit"
                  disabled={profilePending}
                  className={activatePrimaryBtnClass}
                  data-testid="activate-profile-save"
                >
                  {profilePending ? 'Saving…' : 'Save & continue'}
                </button>
              </StepNav>
            </form>
          )}

          {step === 3 && (
            <form action={payoutAction}>
              <h2 className="activate-section-title">Payout preference</h2>
              <p className="activate-section-copy">
                Optional. We pay experts manually for now — this tells ops where to send funds.
              </p>
              {payoutState?.message && !payoutState.success ? (
                <div className="mt-6">
                  <FormAlert message={payoutState.message} />
                </div>
              ) : null}
              <fieldset className="mt-8 flex flex-col gap-1">
                <legend className="sr-only">Payout method</legend>
                {PAYOUT_OPTIONS.map((opt) => (
                  <label key={opt.value} className="activate-payout-option">
                    <input
                      type="radio"
                      name="payoutMethod"
                      value={opt.value}
                      checked={payoutMethod === opt.value}
                      onChange={() => setPayoutMethod(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </fieldset>
              {payoutMethod !== 'unset' && payoutMethod !== 'bank_manual' ? (
                <div className="mt-8">
                  <FieldLabel htmlFor="payoutHandle">Account email / phone / username</FieldLabel>
                  <input
                    id="payoutHandle"
                    name="payoutHandle"
                    defaultValue={profile.payoutHandle}
                    placeholder="Where should we send payouts?"
                    className={fieldErrorInputClass(
                      !!payoutState?.errors?.payoutHandle,
                      activateInputClass,
                    )}
                  />
                  <FieldError message={payoutState?.errors?.payoutHandle?.[0]} />
                </div>
              ) : (
                <input type="hidden" name="payoutHandle" value="" />
              )}
              <StepNav onBack={() => setStep(2)}>
                <button
                  type="submit"
                  disabled={payoutPending}
                  className={activatePrimaryBtnClass}
                  data-testid="activate-payout-save"
                >
                  {payoutPending ? 'Saving…' : 'Continue'}
                </button>
              </StepNav>
            </form>
          )}

          {step === 4 && (
            <div>
              <h2 className="activate-section-title">You&apos;re ready</h2>
              <p className="activate-section-copy">
                Your expert account is activated. Open your dashboard for sessions and profile
                updates anytime.
              </p>
              {completeState?.message ? (
                <div className="mt-6">
                  <FormAlert message={completeState.message} />
                </div>
              ) : null}
              <StepNav>
                <button
                  type="button"
                  disabled={completePending}
                  onClick={() => void onComplete()}
                  className={activatePrimaryBtnClass}
                  data-testid="activate-complete"
                >
                  {completePending ? 'Finishing…' : 'Go to dashboard'}
                </button>
              </StepNav>
            </div>
          )}
        </ActivateCard>
      </div>
    </ActivatePageFrame>
  );
}
