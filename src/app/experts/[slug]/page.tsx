import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getMentorBySlug } from '@/lib/mentor-directory';
import { ExpertProfileSkeleton } from '@/components/loading/route-loading';
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
  return {
    title: `${expert.name} · AstroLink`,
    description: expert.bio.slice(0, 160),
    openGraph: {
      title: `${expert.name} — Verified Aerospace Expert | AstroLink`,
      description: expert.bio.slice(0, 160),
    },
  };
}

export default async function ExpertProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const expert = await getMentorBySlug(slug);

  if (!expert) {
    notFound();
  }

  return (
    <Suspense fallback={<ExpertProfileSkeleton />}>
      <ExpertProfileShell expert={expert} />
    </Suspense>
  );
}
