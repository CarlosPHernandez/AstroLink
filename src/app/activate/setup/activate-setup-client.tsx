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
import { MaterialIcon } from '@/components/ui/material-icon';
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
  {
    value: 'paypal',
    label: 'PayPal',
    hint: 'Email or username',
    icon: 'account_balance_wallet' as const,
  },
  {
    value: 'zelle',
    label: 'Zelle',
    hint: 'Phone or email',
    icon: 'payments' as const,
  },
  {
    value: 'cashapp',
    label: 'Cash App',
    hint: '$cashtag',
    icon: 'attach_money' as const,
  },
  {
    value: 'bank_manual',
    label: 'Bank transfer',
    hint: 'Ops will follow up',
    icon: 'account_balance' as const,
  },
  {
    value: 'unset',
    label: 'Skip for now',
    hint: 'Add later with ops',
    icon: 'schedule' as const,
  },
] as const;

function StepNav({
  onBack,
  children,
}: {
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-outline-variant/50 pt-6 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <button
          type="button"
          className={`${activateSecondaryBtnClass} sm:w-auto`}
          onClick={onBack}
        >
          Back
        </button>
      ) : (
        <span className="hidden sm:block" />
      )}
      <div className="w-full sm:w-auto sm:min-w-[12rem]">{children}</div>
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label className="activate-label" htmlFor={htmlFor}>
      {children}
    </label>
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
          subtitle="Review what we preloaded. Edit anything before you finish — listing visibility stays with ops."
        />
        <ActivateStepProgress currentStep={step} />
        <ActivateCard>
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MaterialIcon name="verified_user" size={28} />
                </div>
                <div className="min-w-0 flex-1 space-y-2 text-left">
                  <h2 className="text-lg font-semibold tracking-tight text-on-surface">
                    Welcome, {firstName}
                  </h2>
                  <p className="text-sm leading-relaxed text-on-surface-variant text-pretty">
                    Your sessions and public profile are already set up. This short flow confirms
                    identity, profile details, and how you prefer to get paid.
                  </p>
                </div>
              </div>
              <ul className="grid gap-2 sm:grid-cols-3">
                {[
                  { icon: 'badge' as const, label: 'Identity' },
                  { icon: 'edit_note' as const, label: 'Profile & rate' },
                  { icon: 'payments' as const, label: 'Payout preference' },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2 rounded-lg border border-outline-variant/70 bg-surface-container-low/50 px-3 py-2.5 text-sm font-medium text-on-surface"
                  >
                    <MaterialIcon name={item.icon} size={20} className="shrink-0 text-primary" />
                    {item.label}
                  </li>
                ))}
              </ul>
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
            <div className="space-y-5">
              <div className="text-left">
                <h2 className="text-base font-semibold tracking-tight text-on-surface">Identity</h2>
                <p className="mt-1 text-sm leading-relaxed text-on-surface-variant text-pretty">
                  How you appear on AstroLink. Sign-in email is locked to this invite.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
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
                <div className="sm:col-span-2">
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
            <form action={profileAction} className="space-y-5">
              <div className="text-left">
                <h2 className="text-base font-semibold tracking-tight text-on-surface">Profile</h2>
                <p className="mt-1 text-sm leading-relaxed text-on-surface-variant text-pretty">
                  Shown to buyers on your expert listing. Edit anything that looks off.
                </p>
              </div>
              {profileState?.message && !profileState.success ? (
                <FormAlert message={profileState.message} />
              ) : null}
              <input type="hidden" name="fullName" value={profile.fullName} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <div className="sm:col-span-2">
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
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="bio">Bio</FieldLabel>
                  <textarea
                    id="bio"
                    name="bio"
                    required
                    rows={5}
                    defaultValue={profile.bio}
                    className={fieldErrorInputClass(
                      !!profileState?.errors?.bio,
                      `${activateInputClass} min-h-[7.5rem] py-3`,
                    )}
                  />
                  <FieldError message={profileState?.errors?.bio?.[0]} />
                </div>
                <div>
                  <FieldLabel htmlFor="rate">Hourly rate (USD)</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                      $
                    </span>
                    <input
                      id="rate"
                      name="rate"
                      type="number"
                      min={0}
                      required
                      defaultValue={profile.rate}
                      className={fieldErrorInputClass(
                        !!profileState?.errors?.rate,
                        `${activateInputClass} pl-7`,
                      )}
                    />
                  </div>
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
            <form action={payoutAction} className="space-y-5">
              <div className="text-left">
                <h2 className="text-base font-semibold tracking-tight text-on-surface">
                  Payout preference
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-on-surface-variant text-pretty">
                  Optional. We pay experts manually for now — this tells ops where to send funds.
                </p>
              </div>
              {payoutState?.message && !payoutState.success ? (
                <FormAlert message={payoutState.message} />
              ) : null}
              <fieldset className="grid gap-2 sm:grid-cols-2">
                <legend className="sr-only">Payout method</legend>
                {PAYOUT_OPTIONS.map((opt) => {
                  const selected = payoutMethod === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={
                        selected
                          ? 'activate-tile activate-tile-selected'
                          : 'activate-tile'
                      }
                    >
                      <input
                        type="radio"
                        name="payoutMethod"
                        value={opt.value}
                        checked={selected}
                        onChange={() => setPayoutMethod(opt.value)}
                        className="mt-1 accent-[var(--color-primary,#0058bc)]"
                      />
                      <span className="flex min-w-0 flex-1 items-start gap-2">
                        <MaterialIcon
                          name={opt.icon}
                          size={20}
                          className={selected ? 'text-primary' : 'text-on-surface-variant'}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-on-surface">
                            {opt.label}
                          </span>
                          <span className="block text-xs text-on-surface-variant">{opt.hint}</span>
                        </span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
              {payoutMethod !== 'unset' && payoutMethod !== 'bank_manual' ? (
                <div>
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
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-[0_4px_20px_rgba(0,88,188,0.22)]">
                  <MaterialIcon name="check_circle" size={32} className="text-on-primary" />
                </div>
                <div className="min-w-0 space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight text-on-surface">
                    You&apos;re ready
                  </h2>
                  <p className="text-sm leading-relaxed text-on-surface-variant text-pretty">
                    Your expert account is activated. Open your dashboard for sessions and profile
                    updates anytime.
                  </p>
                </div>
              </div>
              {completeState?.message ? <FormAlert message={completeState.message} /> : null}
              <StepNav>
                <button
                  type="button"
                  disabled={completePending}
                  onClick={() => void onComplete()}
                  className={activatePrimaryBtnClass}
                  data-testid="activate-complete"
                >
                  {completePending ? (
                    'Finishing…'
                  ) : (
                    <>
                      Go to dashboard
                      <MaterialIcon name="arrow_forward" size={18} className="text-on-primary" />
                    </>
                  )}
                </button>
              </StepNav>
            </div>
          )}
        </ActivateCard>
      </div>
    </ActivatePageFrame>
  );
}
