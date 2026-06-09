import { getSession } from '@/lib/session';
import type { ListedExpert } from '@/lib/mentor-directory';
import ExpertProfileClient from './expert-profile-client';

export default async function ExpertProfileShell({ expert }: { expert: ListedExpert }) {
  const session = await getSession();
  return <ExpertProfileClient expert={expert} session={session} />;
}
