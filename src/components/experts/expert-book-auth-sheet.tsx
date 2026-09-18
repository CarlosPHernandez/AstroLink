'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ProfileBottomSheet } from '@/components/experts/profile-bottom-sheet';
import { FieldError } from '@/components/forms/field-error';
import { FormAlert } from '@/components/forms/form-alert';
import { fieldErrorInputClass } from '@/lib/zod-field-errors';
import {
  loginAction,
  registerAction,
  sendPhoneOtpAction,
  signInWithXAction,
  verifyPhoneOtpAction,
} from '@/app/auth/actions';

type EntryMode = 'choose' | 'phone' | 'email';
type EmailTab = 'login' | 'signup';

const PHONE_AUTH_ENABLED = false;

export function ExpertBookAuthSheet({
  redirectPath,
  supabaseAuth,
  onClose,
}: {
  redirectPath: string;
  supabaseAuth: boolean;
  onClose: () => void;
}) {
  const [entryMode, setEntryMode] = useState<EntryMode>(supabaseAuth ? 'choose' : 'email');
  const [emailTab, setEmailTab] = useState<EmailTab>('signup');
  const [phone, setPhone] = useState('');

  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, undefined);
  const [registerState, registerFormAction, registerPending] = useActionState(
    registerAction,
    undefined,
  );
  const [phoneSendState, phoneSendAction, phoneSendPending] = useActionState(
    sendPhoneOtpAction,
    undefined,
  );
  const [otpState, otpFormAction, otpPending] = useActionState(verifyPhoneOtpAction, undefined);

  const isPending = loginPending || registerPending || phoneSendPending || otpPending;
  const showOtpStep = supabaseAuth && (phoneSendState?.needsOtp || otpState?.phone);
  const activePhone = otpState?.phone || phoneSendState?.phone || phone;

  return (
    <ProfileBottomSheet title="Book this session" onClose={onClose} testId="expert-book-auth-sheet">
      <p className="experts-pro-sheet__lede">
        Sign in or create an account to continue to checkout.
      </p>

      {supabaseAuth && entryMode === 'choose' ? (
        <div className="experts-pro-sheet__stack">
          <button
            type="button"
            className="experts-pro-sheet__primary"
            onClick={() => setEntryMode('email')}
          >
            Continue with email
          </button>
          <button
            type="button"
            className="experts-pro-sheet__secondary"
            disabled={!PHONE_AUTH_ENABLED}
            onClick={() => {
              if (PHONE_AUTH_ENABLED) setEntryMode('phone');
            }}
          >
            Continue with phone
            <span className="experts-pro-sheet__soon">Soon</span>
          </button>
          <p className="experts-pro-sheet__microcopy">
            Phone sign-in is not available yet. Use email or X for now.
          </p>
          <form action={signInWithXAction}>
            <input type="hidden" name="redirect" value={redirectPath} />
            <button type="submit" className="experts-pro-sheet__secondary">
              Continue with X
            </button>
          </form>
        </div>
      ) : null}

      {supabaseAuth && entryMode === 'phone' ? (
        showOtpStep ? (
          <form action={otpFormAction} className="experts-pro-sheet__stack">
            <input type="hidden" name="redirect" value={redirectPath} />
            <input type="hidden" name="phone" value={activePhone} />
            {otpState?.message || phoneSendState?.message ? (
              <FormAlert message={otpState?.message || phoneSendState?.message || ''} />
            ) : null}
            <label className="experts-pro-sheet__field">
              6-digit code
              <input
                name="token"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                disabled={otpPending}
                className={fieldErrorInputClass(
                  !!otpState?.errors?.token,
                  'experts-pro-sheet__input',
                )}
              />
              <FieldError message={otpState?.errors?.token?.[0]} />
            </label>
            <button type="submit" disabled={otpPending} className="experts-pro-sheet__primary">
              {otpPending ? 'Verifying…' : 'Verify and continue'}
            </button>
          </form>
        ) : (
          <form action={phoneSendAction} className="experts-pro-sheet__stack">
            <input type="hidden" name="redirect" value={redirectPath} />
            {phoneSendState?.message ? <FormAlert message={phoneSendState.message} /> : null}
            <label className="experts-pro-sheet__field">
              Phone number
              <input
                name="phone"
                type="tel"
                placeholder="+1 555 123 4567"
                required
                disabled={phoneSendPending}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={fieldErrorInputClass(
                  !!phoneSendState?.errors?.phone,
                  'experts-pro-sheet__input',
                )}
              />
              <FieldError message={phoneSendState?.errors?.phone?.[0]} />
            </label>
              <button type="submit" disabled={phoneSendPending} className="experts-pro-sheet__primary">
                {phoneSendPending ? 'Sending…' : 'Send code'}
            </button>
          </form>
        )
      ) : null}

      {(!supabaseAuth || entryMode === 'email') && (
        <>
          <div className="experts-pro-sheet__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={emailTab === 'signup'}
              className={emailTab === 'signup' ? 'is-active' : ''}
              onClick={() => setEmailTab('signup')}
            >
              Create account
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={emailTab === 'login'}
              className={emailTab === 'login' ? 'is-active' : ''}
              onClick={() => setEmailTab('login')}
            >
              Sign in
            </button>
          </div>

          {emailTab === 'login' && loginState?.message ? (
            <FormAlert message={loginState.message} />
          ) : null}
          {emailTab === 'signup' && registerState?.needsEmailConfirmation ? (
            <p className="experts-pro-sheet__note">{registerState.message}</p>
          ) : null}
          {emailTab === 'signup' && registerState?.message && !registerState.needsEmailConfirmation ? (
            <FormAlert message={registerState.message} />
          ) : null}

          {emailTab === 'login' ? (
            <form action={loginFormAction} className="experts-pro-sheet__stack">
              <input type="hidden" name="redirect" value={redirectPath} />
              <label className="experts-pro-sheet__field">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  disabled={isPending}
                  className={fieldErrorInputClass(
                    !!loginState?.errors?.email,
                    'experts-pro-sheet__input',
                  )}
                />
                <FieldError message={loginState?.errors?.email?.[0]} />
              </label>
              <label className="experts-pro-sheet__field">
                Password
                <input
                  name="password"
                  type="password"
                  required
                  disabled={isPending}
                  className={fieldErrorInputClass(
                    !!loginState?.errors?.password,
                    'experts-pro-sheet__input',
                  )}
                />
                <FieldError message={loginState?.errors?.password?.[0]} />
              </label>
              {supabaseAuth ? (
                <Link href="/auth/forgot-password" className="experts-pro-sheet__text-link">
                  Forgot password?
                </Link>
              ) : null}
              <button type="submit" disabled={isPending} className="experts-pro-sheet__primary">
                {loginPending ? 'Signing in…' : 'Sign in and book'}
              </button>
            </form>
          ) : registerState?.needsEmailConfirmation ? null : (
            <form action={registerFormAction} className="experts-pro-sheet__stack">
              <input type="hidden" name="redirect" value={redirectPath} />
              <label className="experts-pro-sheet__field">
                Full name
                <input
                  name="fullName"
                  type="text"
                  required
                  disabled={isPending}
                  className={fieldErrorInputClass(
                    !!registerState?.errors?.fullName,
                    'experts-pro-sheet__input',
                  )}
                />
                <FieldError message={registerState?.errors?.fullName?.[0]} />
              </label>
              <label className="experts-pro-sheet__field">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  disabled={isPending}
                  className={fieldErrorInputClass(
                    !!registerState?.errors?.email,
                    'experts-pro-sheet__input',
                  )}
                />
                <FieldError message={registerState?.errors?.email?.[0]} />
              </label>
              <label className="experts-pro-sheet__field">
                Password
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  required
                  disabled={isPending}
                  className={fieldErrorInputClass(
                    !!registerState?.errors?.password,
                    'experts-pro-sheet__input',
                  )}
                />
                <FieldError message={registerState?.errors?.password?.[0]} />
              </label>
              <button type="submit" disabled={isPending} className="experts-pro-sheet__primary">
                {registerPending ? 'Creating…' : 'Create account and book'}
              </button>
            </form>
          )}
        </>
      )}

      {supabaseAuth && entryMode !== 'choose' ? (
        <button type="button" className="experts-pro-sheet__text-btn" onClick={() => setEntryMode('choose')}>
          Other sign-in options
        </button>
      ) : null}
    </ProfileBottomSheet>
  );
}
