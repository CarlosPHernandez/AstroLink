'use client';

import { useActionState } from 'react';
import { beginClaimAction, type ActivateActionState } from '@/app/activate/actions';
import { FormAlert } from '@/components/forms/form-alert';

export function ActivateClaimClient({
  token,
  expertName,
  email,
  expiresAt,
}: {
  token: string;
  expertName: string;
  email: string;
  expiresAt: string;
}) {
  const [state, formAction, pending] = useActionState<
    ActivateActionState | undefined,
    FormData
  >(beginClaimAction, undefined);

  const expiresLabel = new Date(expiresAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-4">
      <p className="text-body-md text-on-surface-variant text-center">
        Hi <span className="font-semibold text-on-surface">{expertName}</span> — confirm your
        details to access your AstroLink dashboard and sessions.
      </p>
      <p className="text-label-sm text-on-surface-variant text-center">
        We&apos;ll sign you in as <span className="font-mono text-on-surface">{email}</span>
        . Link expires {expiresLabel}.
      </p>

      {state?.message ? <FormAlert message={state.message} /> : null}

      <form action={formAction}>
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          disabled={pending}
          className="w-full py-sm px-md bg-primary text-on-primary font-label-md rounded-lg disabled:opacity-50"
          data-testid="activate-begin-claim"
        >
          {pending ? 'Starting secure sign-in…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
