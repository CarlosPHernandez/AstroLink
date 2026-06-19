import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMentorBySlug } from '@/lib/mentor-directory';
import { toOptimizedImageUrl } from '@/lib/public-images';
import { WAITLIST_FEATURED_EXPERT_SLUG } from '@/lib/waitlist/waitlist-roster-order';

export const revalidate = 300;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Minimal iframe player for X/Twitter Player Cards — no site chrome. */
export default async function EarlyAccessPlayerPage() {
  const chris = await getMentorBySlug(WAITLIST_FEATURED_EXPERT_SLUG);
  const videoUrl = chris?.introVideoUrl?.trim();
  if (!chris || !videoUrl) {
    notFound();
  }

  const posterPath = toOptimizedImageUrl(chris.imageUrl);

  return (
    <video
      src={videoUrl}
      poster={posterPath}
      controls
      playsInline
      autoPlay
      className="h-full w-full object-contain bg-black"
      aria-label={`Introduction video for ${chris.name}`}
    />
  );
}