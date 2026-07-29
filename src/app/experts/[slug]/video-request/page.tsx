import { notFound } from 'next/navigation';
import { getMentorBySlug } from '@/lib/mentor-directory';
import { mentorVideoOfferActive } from '@/lib/video-requests/state';
import VideoRequestClient from './video-request-client';

export default async function VideoRequestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const expert = await getMentorBySlug(slug);
  if (!expert) {
    notFound();
  }
  if (
    !mentorVideoOfferActive({
      videoRequestsEnabled: Boolean(expert.videoRequestsEnabled),
      videoRequestPriceCents: expert.videoRequestPriceCents ?? 0,
    })
  ) {
    notFound();
  }

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

  return (
    <VideoRequestClient
      expert={{
        slug: expert.slug,
        name: expert.name,
        role: expert.role,
        imageUrl: expert.imageUrl,
        introVideoUrl: expert.introVideoUrl ?? null,
        videoRequestPriceCents: expert.videoRequestPriceCents ?? 0,
        videoRequestSlaDays: expert.videoRequestSlaDays ?? 7,
      }}
      stripePublishableKey={publishableKey}
    />
  );
}
