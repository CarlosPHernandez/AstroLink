import type { MetadataRoute } from 'next';
import { getProductionAppUrl } from '@/lib/app-url';
import { listPublicMentors } from '@/lib/mentor-directory';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getProductionAppUrl();
  const now = new Date();
  const experts = await listPublicMentors();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/early-access`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/experts`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const expertEntries: MetadataRoute.Sitemap = experts.flatMap((expert) => [
    {
      url: `${base}/experts/${expert.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${base}/join/${expert.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ]);

  return [...staticEntries, ...expertEntries];
}