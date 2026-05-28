import React from 'react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import MenteeDashboardClient from './mentee-dashboard-client';

export default async function MenteeDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/auth');
  }

  return <MenteeDashboardClient session={session} />;
}
