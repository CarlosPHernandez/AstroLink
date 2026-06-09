import React, { Suspense } from 'react';
import { LandingAuthNav, LandingAuthNavFallback } from '@/components/server/landing-auth-nav';
import { listPublicMentors } from '@/lib/mentor-directory';
import LandingPageClient from './landing-page-client';

/** Mentor directory is cached; auth nav streams in via Suspense. */
export const revalidate = 300;

export default async function Home() {
  const experts = await listPublicMentors();

  return (
    <LandingPageClient
      experts={experts}
      authNav={
        <Suspense fallback={<LandingAuthNavFallback />}>
          <LandingAuthNav />
        </Suspense>
      }
    />
  );
}
