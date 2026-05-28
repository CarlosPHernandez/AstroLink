import React from 'react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import MentorDashboardClient from './mentor-dashboard-client';

export default async function MentorDashboard() {
  const session = await getSession();
  
  if (!session) {
    redirect('/auth');
  }

  return <MentorDashboardClient session={session} />;
}
