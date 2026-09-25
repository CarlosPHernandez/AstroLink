'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function InviteClaimButton({
  token,
  signedIn,
  authHref,
  bookingPath,
}: {
  token: string;
  signedIn: boolean;
  authHref: string;
  bookingPath: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!signedIn) {
    return (
      <a
        href={authHref}
        className="flex w-full items-center justify-center rounded-lg bg-white py-3 text-base font-bold text-primary-container"
      >
        Continue
      </a>
    );
  }

  if (bookingPath) {
    return (
      <a
        href={bookingPath}
        className="flex w-full items-center justify-center rounded-lg bg-white py-3 text-base font-bold text-primary-container"
      >
        Choose a time
      </a>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <p className="text-sm text-white/80">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        className="flex w-full items-center justify-center rounded-lg bg-white py-3 text-base font-bold text-primary-container disabled:opacity-60"
        onClick={() => {
          setPending(true);
          setError(null);
          void fetch('/api/guest-invites/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          })
            .then(async (res) => {
              const json = (await res.json()) as { error?: string; bookingPath?: string };
              if (!res.ok || !json.bookingPath) {
                setError(json.error ?? 'This invite could not be claimed.');
                setPending(false);
                return;
              }
              router.push(json.bookingPath);
            })
            .catch(() => {
              setError('This invite could not be claimed.');
              setPending(false);
            });
        }}
      >
        {pending ? 'Claiming…' : 'Continue'}
      </button>
    </div>
  );
}
