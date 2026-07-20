'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { FieldError } from '@/components/forms/field-error';
import { FormAlert } from '@/components/forms/form-alert';
import { MaterialIcon } from '@/components/ui/material-icon';
import { fieldErrorInputClass } from '@/lib/zod-field-errors';
import { updatePasswordAction, type ActionState } from '../actions';

export default function UpdatePasswordPage() {
  const [state, formAction, pending] = useActionState<ActionState | undefined, FormData>(
    updatePasswordAction,
    undefined,
  );

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col justify-center items-center p-4 sm:p-gutter font-sans">
      <main className="w-full max-w-[420px]" data-testid="update-password-page">
        <div className="mb-6 text-center flex flex-col items-center">
          <Link
            href="/"
            className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-md shadow-[0_4px_20px_rgba(0,88,188,0.15)]"
            aria-label="Back to home"
          >
            <MaterialIcon name="satellite_alt" className="text-on-primary" size={28} />
          </Link>
          <h1 className="font-headline-md text-headline-md font-bold tracking-tight mb-xs">
            Choose a new password
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant text-center">
            Use at least 8 characters. You&apos;ll sign in with this password next time.
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-5 sm:p-8 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
          {state?.message ? (
            <div className="mb-4" data-testid="update-password-message">
              <FormAlert message={state.message} />
            </div>
          ) : null}

          <form action={formAction} className="flex flex-col gap-md">
            <div>
              <label className="block font-label-sm text-label-sm mb-xs" htmlFor="password">
                New password
              </label>
              <input
                id="password"
                name="password"
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                disabled={pending}
                data-testid="update-password-input"
                className={fieldErrorInputClass(
                  !!state?.errors?.password,
                  'w-full py-sm px-md border border-outline-variant rounded-lg',
                )}
              />
              <FieldError message={state?.errors?.password?.[0]} />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm mb-xs" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                disabled={pending}
                data-testid="update-password-confirm"
                className={fieldErrorInputClass(
                  !!state?.errors?.confirmPassword,
                  'w-full py-sm px-md border border-outline-variant rounded-lg',
                )}
              />
              <FieldError message={state?.errors?.confirmPassword?.[0]} />
            </div>
            <button
              type="submit"
              disabled={pending}
              data-testid="update-password-submit"
              className="w-full py-sm px-md bg-primary text-on-primary font-label-md rounded-lg disabled:opacity-50"
            >
              {pending ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-sm text-on-surface-variant space-x-3">
          <Link href="/auth/forgot-password" className="text-primary font-medium">
            Request a new link
          </Link>
          <span aria-hidden>·</span>
          <Link href="/auth" className="text-primary font-medium">
            Back to sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
