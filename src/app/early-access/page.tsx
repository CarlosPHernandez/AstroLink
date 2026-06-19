import type { Metadata } from 'next';
import { isWaitlistMode } from '@/lib/app-mode';
import { listPublicMentors } from '@/lib/mentor-directory';
import { orderWaitlistRoster } from '@/lib/waitlist/waitlist-roster-order';
import EarlyAccessClient from './early-access-client';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Early Access | AstroLink',
  description:
    'Join the waitlist for AstroLink — live 1:1 video sessions with verified aerospace experts, including Inspiration4 astronaut Chris Sembroski.',
  openGraph: {
    title: 'Early Access | AstroLink',
    description:
      'Book live sessions with astronauts, flight controllers, and aerospace operators. Request early access.',
  },
};

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
