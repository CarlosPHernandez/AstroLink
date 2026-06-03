import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMentorBySlug } from '@/lib/mentor-directory';
import { getSession } from '@/lib/session';
import ExpertProfileClient from './expert-profile-client';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const expert = await getMentorBySlug(slug);
  if (!expert) {
    return { title: 'Expert not found · AstralLink' };
  }
  return {
    title: `${expert.name} · AstralLink`,
    description: expert.bio.slice(0, 160),
  };
}

export default async function ExpertProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const [expert, session] = await Promise.all([getMentorBySlug(slug), getSession()]);

  if (!expert) {
    notFound();
  }

  return <ExpertProfileClient expert={expert} session={session} />;
}
