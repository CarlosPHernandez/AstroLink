import React from 'react';
import { requireRole } from '@/lib/require-session';
import AdminDashboardClient from './admin-dashboard-client';

export default async function AdminDashboard() {
  const session = await requireRole('admin');

  return <AdminDashboardClient session={session} />;
}
