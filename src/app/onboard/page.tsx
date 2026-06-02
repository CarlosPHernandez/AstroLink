import React from 'react';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/require-session';
import OnboardClient from './onboard-client';

export default async function OnboardPage() {
  const session = await requireRole('mentor');

  if (session.onboarded) {
    redirect('/dashboard/mentor');
  }

  return <OnboardClient session={session} />;
}
