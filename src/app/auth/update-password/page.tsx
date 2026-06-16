'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { FieldError } from '@/components/forms/field-error';
import { FormAlert } from '@/components/forms/form-alert';
import { fieldErrorInputClass } from '@/lib/zod-field-errors';
import { updatePasswordAction, type ActionState } from '../actions';

export default function UpdatePasswordPage() {
  const [state, formAction, pending] = useActionState<ActionState | undefined, FormData>(
    updatePasswordAction,
    undefined,
  );

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col justify-center items-center p-4">
      <main className="w-full max-w-[420px]">
        <h1 className="font-headline-md text-headline-md font-bold text-center mb-2">
          Choose a new password
        </h1>

        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl mt-6">
          {state?.message ? (
            <div className="mb-4">
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
                disabled={pending}
                className={fieldErrorInputClass(
                  !!state?.errors?.password,
                  'w-full py-sm px-md border border-outline-variant rounded-lg',
                )}
              />
              <FieldError message={state?.errors?.password?.[0]} />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full py-sm px-md bg-primary text-on-primary font-label-md rounded-lg"
            >
              {pending ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>

        <p className="text-center mt-4">
          <Link href="/auth" className="text-primary text-sm">
            Back to sign in
          </Link>
        </p>
      </main>
    </div>
  );
}