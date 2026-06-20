import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMentorBySlug } from '@/lib/mentor-directory';
import { buildPageMetadata } from '@/lib/seo/build-page-metadata';
import JoinExpertClient from './join-expert-client';

export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

function joinExpertReferrer(slug: string): string {
  return `expert-${slug}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const expert = await getMentorBySlug(slug);
  if (!expert) {
    return { title: 'Not found · AstroLink' };
  }

  return buildPageMetadata({ pageType: 'join-expert', expert });
}

export default async function JoinExpertPage({ params }: PageProps) {
  const { slug } = await params;
  const expert = await getMentorBySlug(slug);
  if (!expert) {
    notFound();
  }

  return (
    <JoinExpertClient
      expert={expert}
      copyrightYear={new Date().getFullYear()}
      defaultReferrer={joinExpertReferrer(slug)}
    />
  );
}