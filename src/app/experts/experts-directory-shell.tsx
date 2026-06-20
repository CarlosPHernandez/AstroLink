import { isWaitlistMode } from '@/lib/app-mode';
import type { ListedExpert } from '@/lib/mentor-directory';
import { getSession } from '@/lib/session';
import ExpertsDirectoryClient from './experts-directory-client';

export default async function ExpertsDirectoryShell({ experts }: { experts: ListedExpert[] }) {
  const session = await getSession();
  return (
    <ExpertsDirectoryClient
      experts={experts}
      isSignedIn={Boolean(session)}
      waitlistMode={isWaitlistMode()}
    />
  );
}