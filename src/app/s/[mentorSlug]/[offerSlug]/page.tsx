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
    <div className="landing-mission min-h-screen bg-[var(--landing-canvas)] text-[var(--landing-text)] font-landing-body">
      <OfferPublicClient mentorSlug={mentorSlug} offerSlug={offerSlug} />
      <header className="border-b border-[var(--landing-border)] bg-[var(--landing-surface)]">
        <div className="mx-auto flex w-full max-w-[40rem] items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-[1.05rem] font-bold tracking-tight text-[var(--landing-text)]"
          >
            AstroLink
          </Link>
          <Link
            href="/experts"
            className="text-sm text-[var(--landing-muted)] hover:text-[var(--landing-text)]"
          >
            Directory
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[40rem] px-6 py-10 sm:py-14">
        <article className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-8">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] border border-[var(--landing-border)] bg-[var(--landing-surface-soft)]">
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
              <p className="text-base font-semibold text-[var(--landing-text)]">{expert.name}</p>
              <p className="mt-0.5 text-sm text-[var(--landing-muted)]">{expert.role}</p>
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-[var(--landing-text)]">
            {offer.title}
          </h1>
          <p className="mt-2 text-sm font-medium tabular-nums text-[var(--landing-text)]">
            {offer.duration_minutes} min · {formatMoney(offer.price_cents)}
          </p>

          <p className="mt-6 whitespace-pre-wrap text-body-md leading-relaxed text-[var(--landing-muted)]">
            {offer.description}
          </p>

          <p className="mt-6 text-sm text-[var(--landing-text)]">
            What you get: live video · {offer.duration_minutes} minutes
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={bookHref}
              data-testid="offer-book-cta"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--landing-ink)] px-6 text-sm font-semibold text-white hover:bg-black"
            >
              Book this session
            </Link>
            <Link
              href={profileHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-6 text-sm font-semibold text-[var(--landing-text)] hover:border-[var(--landing-muted)]"
            >
              View full profile
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
