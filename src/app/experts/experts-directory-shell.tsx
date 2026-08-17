import { isWaitlistMode } from '@/lib/app-mode';
import type { DirectoryExpert } from '@/lib/directory-expert';
import { getSession } from '@/lib/session';
import ExpertsDirectoryClient from './experts-directory-client';

export default async function ExpertsDirectoryShell({ experts }: { experts: DirectoryExpert[] }) {
  const session = await getSession();
  return (
    <ExpertsDirectoryClient
      experts={experts}
      isSignedIn={Boolean(session)}
      waitlistMode={isWaitlistMode()}
    />
  );
}