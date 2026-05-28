import React from 'react';
import { getSession } from '@/lib/session';
import LandingPageClient from './landing-page-client';

export default async function Home() {
  const session = await getSession();

  return <LandingPageClient session={session} />;
}
