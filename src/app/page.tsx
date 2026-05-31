import React from 'react';
import { listPublicMentors } from '@/lib/mentor-directory';
import { getSession } from '@/lib/session';
import LandingPageClient from './landing-page-client';

export default async function Home() {
  const [session, experts] = await Promise.all([getSession(), listPublicMentors()]);

  return <LandingPageClient session={session} experts={experts} />;
}
