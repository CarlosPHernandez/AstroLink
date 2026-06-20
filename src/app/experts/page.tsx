import type { Metadata } from 'next';
import { listPublicMentors } from '@/lib/mentor-directory';
import { buildPageMetadata } from '@/lib/seo/build-page-metadata';
import ExpertsDirectoryShell from './experts-directory-shell';

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({ pageType: 'experts-index' });

export default async function ExpertsDirectoryPage() {
  const experts = await listPublicMentors();
  return <ExpertsDirectoryShell experts={experts} />;
}
