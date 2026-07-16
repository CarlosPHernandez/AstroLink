import { redirect } from 'next/navigation';
import { WAITLIST_PUBLIC_LANDING_PATH } from '@/lib/waitlist/waitlist-landing';

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Retired partner waitlist landings — route to Chris campaign with expert attribution. */
export default async function JoinExpertPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(
    `${WAITLIST_PUBLIC_LANDING_PATH}?ref=${encodeURIComponent(`expert-${slug}`)}`,
  );
}