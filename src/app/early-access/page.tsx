import type { Metadata } from 'next';
import { isWaitlistMode } from '@/lib/app-mode';
import { listPublicMentors } from '@/lib/mentor-directory';
import { buildEarlyAccessMetadata } from '@/lib/waitlist/early-access-social-meta';
import { orderWaitlistRoster } from '@/lib/waitlist/waitlist-roster-order';
import EarlyAccessClient from './early-access-client';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildEarlyAccessMetadata();
}

export default async function EarlyAccessPage() {
  const experts = orderWaitlistRoster(await listPublicMentors());

  return (
    <EarlyAccessClient
      copyrightYear={new Date().getFullYear()}
      showExpertsLink={!isWaitlistMode()}
      experts={experts}
    />
  );
}
