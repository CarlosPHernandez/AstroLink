import Image from 'next/image';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';

/**
 * High-impact split hero — large still leads; copy is secondary.
 * Restores the earlier layout that had stronger visual presence.
 */
export function EducatorsHero() {
  return (
    <section
      className="border-b border-[var(--landing-border)] bg-[var(--landing-surface)] pt-10 sm:pt-14 lg:pt-16 pb-10 sm:pb-14 lg:pb-16"
      data-testid="educators-hero"
      aria-labelledby="educators-hero-title"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 lg:items-center">
          {/* Copy */}
          <div className="lg:col-span-5 order-2 lg:order-1 text-center lg:text-left">
            <p className="text-sm font-semibold text-[var(--landing-accent)]">
              For schools &amp; educators
            </p>

            <h1
              id="educators-hero-title"
              className="mt-2 font-landing-display text-[1.85rem] leading-[1.1] sm:text-[2.4rem] lg:text-[2.65rem] font-extrabold tracking-tight text-[var(--landing-text)] text-balance"
            >
              Real access for your students, without the speaker fee.
            </h1>

            <p className="mt-4 text-base text-[var(--landing-muted)] leading-relaxed max-w-[38ch] mx-auto lg:mx-0">
              Live video with verified aerospace professionals — on your calendar, without flights,
              hotels, or AV contracts.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <a
                href="#demo"
                className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-1.5 rounded-full bg-[var(--landing-ink)] px-6 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-2"
                data-testid="educators-hero-demo-cta"
              >
                Book a demo
                <MaterialIcon name="arrow_forward" size={16} className="text-white shrink-0" />
              </a>
              <a
                href="#why-astrolink"
                className="inline-flex min-h-12 touch-manipulation items-center justify-center rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-5 text-sm font-semibold text-[var(--landing-text)] hover:border-[var(--landing-muted)]"
              >
                See why it works
              </a>
            </div>

            <p className="mt-5 text-sm text-[var(--landing-muted)]">
              $0 travel · Days to book · Live 1:1 or group
            </p>

            <p className="mt-3 text-sm">
              <Link
                href="/experts"
                className="font-semibold text-[var(--landing-accent)] hover:text-[var(--landing-accent-hover)] underline-offset-2 hover:underline"
              >
                Browse experts your class can book →
              </Link>
            </p>
          </div>

          {/* Large visual — image leads on mobile + desktop */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none lg:ml-auto overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] shadow-[0_28px_56px_-28px_rgba(14,20,32,0.35)]">
              <div className="relative aspect-[4/3] sm:aspect-[5/4] lg:aspect-[4/3] w-full min-h-[280px] sm:min-h-[360px] lg:min-h-[440px]">
                <Image
                  src="/educators/hero-live-session.jpg"
                  alt="Students and an instructor in a bright classroom on a live video call with a professional mentor"
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 640px"
                  className="object-cover object-[center_42%]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
