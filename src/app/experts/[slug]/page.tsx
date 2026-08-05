import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SeoJsonLd } from '@/components/seo/seo-json-ld';
import { ExpertProfileSkeleton } from '@/components/loading/route-loading';
import { getApprovedReviewsForExpert } from '@/lib/expert-reviews';
import { getMentorBySlug } from '@/lib/mentor-directory';
import { buildPageMetadata } from '@/lib/seo/build-page-metadata';
import { buildPersonJsonLd } from '@/lib/seo/json-ld';
import ExpertProfileShell from './expert-profile-shell';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const expert = await getMentorBySlug(slug);
  if (!expert) {
    return {
      title: 'Expert not found · AstroLink',
      description: 'This profile is not in the verified directory.',
    };
  }
  return buildPageMetadata({ pageType: 'expert-profile', expert });
}

export default async function ExpertProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const expert = await getMentorBySlug(slug);

  if (!expert) {
    notFound();
  }

  const reviews = await getApprovedReviewsForExpert(expert.id);

  return (
    <>
      <SeoJsonLd data={buildPersonJsonLd(expert)} />
      <Suspense fallback={<ExpertProfileSkeleton />}>
        <ExpertProfileShell expert={expert} reviews={reviews} />
      </Suspense>
    </>
  );
}
