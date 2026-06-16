'use client';

import { Suspense, useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FieldError } from '@/components/forms/field-error';
import { FormAlert } from '@/components/forms/form-alert';
import { fieldErrorInputClass } from '@/lib/zod-field-errors';
import { completeProfileAction, type ActionState } from '../actions';

function CompleteProfileContent() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') ?? '';
  const [state, formAction, pending] = useActionState<ActionState | undefined, FormData>(
    completeProfileAction,
    undefined,
  );

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col justify-center items-center p-4">
      <main className="w-full max-w-[420px]">
        <h1 className="font-headline-md text-headline-md font-bold text-center mb-2">
          Finish your profile
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant text-center mb-6">
          We need your name and email for booking confirmations and receipts.
        </p>

        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl">
          {state?.message ? (
            <div className="mb-4">
              <FormAlert message={state.message} />
            </div>
          ) : null}

          <form action={formAction} className="flex flex-col gap-md">
            {redirectPath ? <input type="hidden" name="redirect" value={redirectPath} /> : null}
            <div>
              <label className="block font-label-sm text-label-sm mb-xs" htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                required
                type="text"
                disabled={pending}
                className={fieldErrorInputClass(
                  !!state?.errors?.fullName,
                  'w-full py-sm px-md border border-outline-variant rounded-lg bg-surface-container-lowest',
                )}
              />
              <FieldError message={state?.errors?.fullName?.[0]} />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm mb-xs" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                required
                type="email"
                disabled={pending}
                className={fieldErrorInputClass(
                  !!state?.errors?.email,
                  'w-full py-sm px-md border border-outline-variant rounded-lg bg-surface-container-lowest',
                )}
              />
              <FieldError message={state?.errors?.email?.[0]} />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full py-sm px-md bg-primary text-on-primary font-label-md rounded-lg disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Continue'}
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

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={null}>
      <CompleteProfileContent />
    </Suspense>
  );
}