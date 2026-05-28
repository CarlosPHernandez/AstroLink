import React from 'react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './admin-dashboard-client';

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/auth');
  }

  if (session.role !== 'admin') {
    redirect(session.role === 'mentor' ? '/dashboard/mentor' : '/dashboard/mentee');
  }

  return <AdminDashboardClient session={session} />;
}
