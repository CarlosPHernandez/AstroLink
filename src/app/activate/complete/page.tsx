import React from 'react';
import { redirect } from 'next/navigation';

import { completeClaimLinkAction } from '@/app/activate/actions';
import { createClient } from '@/lib/supabase/server';

type SearchParams = Promise<{ token?: string }>;

export default async function ActivateCompletePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawToken = params.token?.trim() ?? '';

  if (!rawToken) {
    redirect('/activate');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-body-md text-on-surface-variant text-center max-w-md">
          Sign-in did not complete. Open your activation email again, or contact support.
        </p>
      </div>
    );
  }

  const result = await completeClaimLinkAction(rawToken);
  if (!result.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="font-headline-md text-headline-md font-bold">Could not finish link</h1>
          <p className="text-body-md text-on-surface-variant">{result.message}</p>
        </div>
      </div>
    );
  }

  redirect('/activate/setup');
}
