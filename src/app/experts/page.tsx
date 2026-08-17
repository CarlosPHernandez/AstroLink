import type { Metadata } from 'next';
import type { DirectoryExpert } from '@/lib/directory-expert';
import { getDirectoryReviewSummaries } from '@/lib/expert-reviews/directory-summaries';
import { listPublicMentors } from '@/lib/mentor-directory';
import { buildPageMetadata } from '@/lib/seo/build-page-metadata';
import ExpertsDirectoryShell from './experts-directory-shell';

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({ pageType: 'experts-index' });

export default async function ExpertsDirectoryPage() {
  const experts = await listPublicMentors();
  const summaries = await getDirectoryReviewSummaries(experts.map((expert) => expert.id));
  const directoryExperts: DirectoryExpert[] = experts.map((expert) => ({
    ...expert,
    reviewSummary: summaries[expert.id],
  }));
  return <ExpertsDirectoryShell experts={directoryExperts} />;
}
