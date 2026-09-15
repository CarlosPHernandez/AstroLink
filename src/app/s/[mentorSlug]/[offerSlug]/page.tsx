import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadPublicOffer } from '@/lib/expert-offers/load-public-offer';
import { offerPublicPath } from '@/lib/expert-offers/path';
import { formatMoney } from '@/lib/format';
import { toOptimizedImageUrl } from '@/lib/public-images';
import { OfferPublicClient } from './offer-public-client';

type PageProps = {
  params: Promise<{ mentorSlug: string; offerSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { mentorSlug, offerSlug } = await params;
  const loaded = await loadPublicOffer(mentorSlug, offerSlug);
  if (!loaded) {
    return { title: 'Session not found' };
  }
  return {
    title: loaded.offer.title,
    description: loaded.offer.description,
    alternates: { canonical: offerPublicPath(loaded.expert.slug, loaded.offer.slug) },
  };
}

export default async function PublicOfferPage({ params }: PageProps) {
  const { mentorSlug, offerSlug } = await params;
  const loaded = await loadPublicOffer(mentorSlug, offerSlug);
  if (!loaded) {
    notFound();
  }

  const { offer, expert } = loaded;
  const bookHref = `/booking?mentor=${encodeURIComponent(expert.slug)}&offer=${encodeURIComponent(offer.slug)}`;
  const profileHref = `/experts/${expert.slug}`;

  return (
    <div className="min-h-screen bg-background font-[family-name:var(--font-montserrat)] text-on-surface">
      <OfferPublicClient mentorSlug={mentorSlug} offerSlug={offerSlug} />
      <header className="border-b border-outline-variant bg-surface">
        <div className="mx-auto flex w-full max-w-[var(--max-width-content)] items-center px-lg py-md">
          <Link href="/" className="text-sm font-bold tracking-tight text-on-surface">
            AstroLink
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[var(--max-width-content)] px-lg py-xl">
        <article className="rounded-lg border border-outline-variant bg-surface p-lg shadow-sm sm:p-xl">
          <div className="flex items-center gap-md">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-outline-variant bg-surface-container-low">
              <Image
                src={toOptimizedImageUrl(expert.imageUrl)}
                alt={expert.name}
                fill
                className="object-cover"
                sizes="64px"
                priority
              />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-on-surface">{expert.name}</p>
              <p className="mt-0.5 text-sm text-on-surface-variant">{expert.role}</p>
            </div>
          </div>

          <h1 className="mt-lg text-2xl font-bold tracking-tight text-on-surface">{offer.title}</h1>
          <p className="mt-sm text-sm font-medium tabular-nums text-on-surface">
            {offer.duration_minutes} min · {formatMoney(offer.price_cents)}
          </p>

          <p className="mt-lg whitespace-pre-wrap text-body-md text-on-surface-variant">
            {offer.description}
          </p>

          <p className="mt-lg text-sm text-on-surface">
            What you get: live video · {offer.duration_minutes} minutes
          </p>

          <div className="mt-xl flex flex-col gap-sm sm:flex-row sm:items-center">
            <Link
              href={bookHref}
              data-testid="offer-book-cta"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--landing-ink)] px-6 text-sm font-semibold text-white hover:opacity-90"
            >
              Book this session
            </Link>
            <Link
              href={profileHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-outline-variant bg-surface px-6 text-sm font-semibold text-on-surface hover:border-outline"
            >
              View full profile
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
