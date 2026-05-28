import React from 'react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import OnboardClient from './onboard-client';

export default async function OnboardPage() {
  const session = await getSession();

  // 1. Session Protection
  if (!session) {
    redirect('/auth');
  }

  // 2. Role Restriction
  if (session.role !== 'mentor') {
    redirect(session.role === 'admin' ? '/dashboard/admin' : '/dashboard/mentee');
  }

  // 3. Already Onboarded Check
  if (session.onboarded) {
    redirect('/dashboard/mentor');
  }

  return <OnboardClient session={session} />;
}
