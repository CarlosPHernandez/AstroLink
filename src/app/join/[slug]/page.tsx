import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMentorBySlug } from '@/lib/mentor-directory';
import JoinExpertClient from './join-expert-client';

export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

function truncateMetaDescription(text: string, max = 160): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function joinExpertReferrer(slug: string): string {
  return `expert-${slug}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const expert = await getMentorBySlug(slug);
  if (!expert) {
    return { title: 'Not found · AstroLink' };
  }

  const fallback = `Join the waitlist for live 1:1 video sessions with ${expert.name} on AstroLink.`;
  const description = truncateMetaDescription(expert.bio.trim() || fallback);

  return {
    title: `Early access · ${expert.name}`,
    description,
    openGraph: {
      title: `Early access · ${expert.name} · AstroLink`,
      description,
    },
  };
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