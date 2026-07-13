'use client';

import React, { useActionState, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FieldError } from '@/components/forms/field-error';
import { FormAlert } from '@/components/forms/form-alert';
import { MaterialIcon } from '@/components/ui/material-icon';
import { fieldErrorInputClass } from '@/lib/zod-field-errors';
import {
  loginAction,
  registerAction,
  sendPhoneOtpAction,
  signInWithXAction,
  verifyPhoneOtpAction,
} from './actions';

type EntryMode = 'choose' | 'phone' | 'email';
type EmailTab = 'login' | 'signup';

export default function AuthPageClient({ supabaseAuth }: { supabaseAuth: boolean }) {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') ?? '';
  const initialEmailTab: EmailTab = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const initialEntryMode: EntryMode = initialEmailTab === 'signup' ? 'email' : supabaseAuth ? 'choose' : 'email';

  const [entryMode, setEntryMode] = useState<EntryMode>(initialEntryMode);
  const [emailTab, setEmailTab] = useState<EmailTab>(initialEmailTab);
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
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col justify-center items-center p-4 sm:p-gutter font-sans">
      <main className="w-full max-w-[420px]">
        <div className="mb-6 text-center flex flex-col items-center">
          <Link
            href="/"
            className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-md shadow-[0_4px_20px_rgba(0,88,188,0.15)]"
            aria-label="Back to home"
          >
            <MaterialIcon name="satellite_alt" className="text-on-primary" size={28} />
          </Link>
          <Link href="/" className="font-headline-md text-headline-md font-bold tracking-tight mb-xs">
            AstroLink
          </Link>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {entryMode === 'phone'
              ? showOtpStep
                ? 'Enter your verification code'
                : 'Sign in with your phone'
              : emailTab === 'login'
                ? 'Sign in to your account'
                : 'Unlock the expert network'}
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-5 sm:p-8 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
          {supabaseAuth && entryMode === 'choose' ? (
            <div className="flex flex-col gap-sm">
              <button
                type="button"
                onClick={() => setEntryMode('phone')}
                className="w-full py-sm px-md bg-primary text-on-primary font-label-md rounded-lg"
              >
                Continue with phone
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('email')}
                className="w-full py-sm px-md border border-outline-variant font-label-md rounded-lg hover:bg-surface"
              >
                Continue with email
              </button>
              <form action={signInWithXAction}>
                {redirectPath ? <input type="hidden" name="redirect" value={redirectPath} /> : null}
                <button
                  type="submit"
                  className="w-full py-sm px-md border border-outline-variant font-label-md rounded-lg hover:bg-surface flex items-center justify-center gap-sm"
                >
                  Continue with X
                </button>
              </form>
            </div>
          ) : null}

          {supabaseAuth && entryMode === 'phone' ? (
            showOtpStep ? (
              <form action={otpFormAction} className="flex flex-col gap-md">
                {redirectPath ? <input type="hidden" name="redirect" value={redirectPath} /> : null}
                <input type="hidden" name="phone" value={activePhone} />
                {otpState?.message || phoneSendState?.message ? (
                  <FormAlert message={otpState?.message || phoneSendState?.message || ''} />
                ) : null}
                <div>
                  <label className="block font-label-sm mb-xs" htmlFor="token">
                    6-digit code
                  </label>
                  <input
                    id="token"
                    name="token"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    disabled={otpPending}
                    className={fieldErrorInputClass(
                      !!otpState?.errors?.token,
                      'w-full py-sm px-md border border-outline-variant rounded-lg tracking-widest text-center',
                    )}
                  />
                  <FieldError message={otpState?.errors?.token?.[0]} />
                </div>
                <button
                  type="submit"
                  disabled={otpPending}
                  className="w-full py-sm px-md bg-primary text-on-primary font-label-md rounded-lg"
                >
                  {otpPending ? 'Verifying…' : 'Verify and continue'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('phone');
                  }}
                  className="text-sm text-primary"
                >
                  Change number
                </button>
              </form>
            ) : (
              <form action={phoneSendAction} className="flex flex-col gap-md">
                {redirectPath ? <input type="hidden" name="redirect" value={redirectPath} /> : null}
                {phoneSendState?.message ? <FormAlert message={phoneSendState.message} /> : null}
                <div>
                  <label className="block font-label-sm mb-xs" htmlFor="phone">
                    Phone number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 555 123 4567"
                    required
                    disabled={phoneSendPending}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={fieldErrorInputClass(
                      !!phoneSendState?.errors?.phone,
                      'w-full py-sm px-md border border-outline-variant rounded-lg',
                    )}
                  />
                  <FieldError message={phoneSendState?.errors?.phone?.[0]} />
                  <p className="text-xs text-on-surface-variant mt-1">
                    Include country code, e.g. +1 for US.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={phoneSendPending}
                  className="w-full py-sm px-md bg-primary text-on-primary font-label-md rounded-lg"
                >
                  {phoneSendPending ? 'Sending…' : 'Send code'}
                </button>
              </form>
            )
          ) : null}

          {(!supabaseAuth || entryMode === 'email') && (
            <>
              <div className="flex border-b border-outline-variant mb-6" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={emailTab === 'login'}
                  onClick={() => setEmailTab('login')}
                  className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 ${
                    emailTab === 'login' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={emailTab === 'signup'}
                  onClick={() => setEmailTab('signup')}
                  className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 ${
                    emailTab === 'signup' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
                  }`}
                >
                  Create account
                </button>
              </div>

              {emailTab === 'login' && loginState?.message ? (
                <div className="mb-4">
                  <FormAlert message={loginState.message} />
                </div>
              ) : null}
              {emailTab === 'signup' && registerState?.needsEmailConfirmation ? (
                <div className="mb-4 p-4 bg-primary-container/10 border border-primary-container/20 rounded-lg text-sm">
                  {registerState.message}
                </div>
              ) : null}
              {emailTab === 'signup' && registerState?.message && !registerState.needsEmailConfirmation ? (
                <div className="mb-4">
                  <FormAlert message={registerState.message} />
                </div>
              ) : null}

              {emailTab === 'login' ? (
                <form action={loginFormAction} className="flex flex-col gap-md">
                  {redirectPath ? <input type="hidden" name="redirect" value={redirectPath} /> : null}
                  <div>
                    <label className="block font-label-sm mb-xs" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      disabled={isPending}
                      className={fieldErrorInputClass(
                        !!loginState?.errors?.email,
                        'w-full py-sm px-md border border-outline-variant rounded-lg',
                      )}
                    />
                    <FieldError message={loginState?.errors?.email?.[0]} />
                  </div>
                  <div>
                    <label className="block font-label-sm mb-xs" htmlFor="password">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      disabled={isPending}
                      className={fieldErrorInputClass(
                        !!loginState?.errors?.password,
                        'w-full py-sm px-md border border-outline-variant rounded-lg',
                      )}
                    />
                    <FieldError message={loginState?.errors?.password?.[0]} />
                  </div>
                  {supabaseAuth ? (
                    <Link href="/auth/forgot-password" className="text-sm text-primary -mt-2">
                      Forgot password?
                    </Link>
                  ) : null}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-sm px-md bg-primary text-on-primary font-label-md rounded-lg"
                  >
                    {loginPending ? 'Signing in…' : 'Sign in'}
                  </button>
                </form>
              ) : registerState?.needsEmailConfirmation ? null : (
                <form action={registerFormAction} className="flex flex-col gap-md">
                  {redirectPath ? <input type="hidden" name="redirect" value={redirectPath} /> : null}
                  <div>
                    <label className="block font-label-sm mb-xs" htmlFor="fullName">
                      Full name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      disabled={isPending}
                      className={fieldErrorInputClass(
                        !!registerState?.errors?.fullName,
                        'w-full py-sm px-md border border-outline-variant rounded-lg',
                      )}
                    />
                    <FieldError message={registerState?.errors?.fullName?.[0]} />
                  </div>
                  <div>
                    <label className="block font-label-sm mb-xs" htmlFor="regEmail">
                      Email
                    </label>
                    <input
                      id="regEmail"
                      name="email"
                      type="email"
                      required
                      disabled={isPending}
                      className={fieldErrorInputClass(
                        !!registerState?.errors?.email,
                        'w-full py-sm px-md border border-outline-variant rounded-lg',
                      )}
                    />
                    <FieldError message={registerState?.errors?.email?.[0]} />
                  </div>
                  <div>
                    <label className="block font-label-sm mb-xs" htmlFor="regPassword">
                      Password
                    </label>
                    <input
                      id="regPassword"
                      name="password"
                      type="password"
                      minLength={8}
                      required
                      disabled={isPending}
                      className={fieldErrorInputClass(
                        !!registerState?.errors?.password,
                        'w-full py-sm px-md border border-outline-variant rounded-lg',
                      )}
                    />
                    <FieldError message={registerState?.errors?.password?.[0]} />
                  </div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-sm px-md bg-primary text-on-primary font-label-md rounded-lg"
                  >
                    {registerPending ? 'Creating…' : 'Create account'}
                  </button>
                </form>
              )}
            </>
          )}

          {supabaseAuth && entryMode !== 'choose' ? (
            <button
              type="button"
              onClick={() => setEntryMode('choose')}
              className="w-full mt-4 text-sm text-on-surface-variant hover:text-primary"
            >
              Other sign-in options
            </button>
          ) : null}
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/"
            data-testid="auth-back-to-home"
            className="text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
