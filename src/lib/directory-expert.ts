import type { ListedExpert } from '@/lib/mentor-directory';

export type DirectoryReviewSummary = {
  average: number;
  count: number;
};

export type DirectoryExpert = ListedExpert & {
  reviewSummary?: DirectoryReviewSummary;
};
