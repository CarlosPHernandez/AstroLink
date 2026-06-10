import type { Metadata } from 'next';
import { listPublicMentors } from '@/lib/mentor-directory';
import ExpertsDirectoryClient from './experts-directory-client';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Experts · AstroLink',
  description:
    'Browse verified aerospace experts — astronauts, flight controllers, and operators. Watch intro videos and book live 1:1 sessions.',
  openGraph: {
    title: 'Verified Experts | AstroLink',
    description:
      'Browse and book live sessions with verified aerospace experts.',
  },
};

export default async function ExpertsDirectoryPage() {
  const experts = await listPublicMentors();
  return <ExpertsDirectoryClient experts={experts} />;
}
