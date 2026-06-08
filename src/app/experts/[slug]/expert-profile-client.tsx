'use client';

import React from 'react';
import Link from 'next/link';
import { ExpertIntroMedia } from '@/components/ExpertIntroMedia';
import type { ListedExpert } from '@/lib/mentor-directory';

interface SessionData {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
}

export default function ExpertProfileClient({
  expert,
  session,
}: {
  expert: ListedExpert;
  session: SessionData | null;
}) {
  const bookHref = session
    ? `/booking?mentor=${encodeURIComponent(expert.slug)}`
    : `/auth?redirect=${encodeURIComponent(`/booking?mentor=${expert.slug}`)}`;

  const firstName = expert.name.split(' ')[0];

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      {/* Sticky header — mirrors landing language */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-outline-variant">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg h-20 flex justify-between items-center w-full">
          <Link href="/" className="font-bold text-lg text-on-surface tracking-tight">
            AstroLink
          </Link>

          <div className="flex items-center gap-sm sm:gap-lg">
            <Link
              href="/#directory"
              className="text-on-surface-variant font-label-md text-xs sm:text-label-md hover:text-primary transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span className="hidden sm:inline">Directory</span>
            </Link>

            <Link
              href={bookHref}
              data-testid="expert-profile-book"
              className="bg-primary text-on-primary px-3.5 py-2 sm:px-lg sm:py-sm rounded-md font-label-md text-xs sm:text-label-md hover:bg-primary-container active:scale-95 transition-all shadow-sm"
            >
              {expert.availability === 'Available Now' ? 'Book session' : 'Schedule'} · ${expert.rate}/hr
            </Link>

            {session ? (
              <Link
                href={
                  session.role === 'admin'
                    ? '/dashboard/admin'
                    : session.role === 'mentor'
                    ? '/dashboard/mentor'
                    : '/dashboard/mentee'
                }
                className="text-on-surface-variant font-label-md text-xs sm:text-label-md hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth"
                className="text-on-surface-variant font-label-md text-xs sm:text-label-md hover:text-primary transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-lg pb-24 pt-8 md:pt-12">
        {/* Hero */}
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 items-start mb-12">
          {/* Media (left on desktop) */}
          <div className="lg:col-span-7">
            <ExpertIntroMedia
              name={expert.name}
              imageUrl={expert.imageUrl}
              introVideoUrl={expert.introVideoUrl}
              className="aspect-[3/4] w-full max-w-[min(100%,340px)] sm:max-w-[360px] lg:max-w-[380px] mx-auto lg:mx-0"
              priority
            />
            <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/70">
              Watch the intro — tone, clarity, and real mission experience before you book.
            </p>
          </div>

          {/* Key facts + CTAs (right on desktop) */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-container/10 px-3 py-1 mb-3">
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
                Verified Aerospace Expert
              </span>
            </div>

            <h1
              className="font-display text-3xl md:text-4xl font-bold tracking-tighter text-on-surface"
              data-testid="expert-profile-name"
            >
              {expert.name}
            </h1>
            <p className="mt-1 text-lg text-on-surface-variant">{expert.role}</p>
            <p className="text-on-surface-variant/80">{expert.employer}</p>

            {/* Availability + rate */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {expert.availability === 'Available Now' ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                    Available now
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-300" />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    Book a session
                  </span>
                </div>
              )}

              <div className="font-mono text-sm font-semibold text-on-surface">
                ${expert.rate}/hr
              </div>
            </div>

            {/* Primary CTA */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href={bookHref}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-[11px] font-bold uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-container active:scale-[0.985]"
              >
                <span className="material-symbols-outlined text-[20px]">videocam</span>
                Book live 1:1 with {firstName}
              </Link>

              <Link
                href="/#directory"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
              >
                Explore other experts
              </Link>
            </div>

            <p className="mt-3 text-[10px] text-on-surface-variant font-light">
              30-minute encrypted video session • AI briefing included • Payment held until call ends
            </p>
          </div>
        </div>

        {/* About / Bio — two-column with sticky booking aside */}
        <section className="mb-12 grid gap-8 lg:grid-cols-12 lg:gap-10 items-start">
          {/* Bio (left) */}
          <div className="lg:col-span-7">
            <div className="uppercase tracking-[0.2em] text-[10px] font-mono font-semibold text-primary mb-2">
              The pedigree
            </div>
            <h2 className="text-headline-md font-semibold tracking-tight mb-4">About {firstName}</h2>
            <div className="prose prose-neutral max-w-prose text-body-md text-on-surface font-light leading-relaxed">
              {expert.bio.split('\n').map((para, i) => (
                <p key={i} className={i > 0 ? 'mt-4' : ''}>
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Sticky booking + quick facts (right) */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-28 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl font-semibold text-on-surface">${expert.rate}</span>
                <span className="text-xs text-on-surface-variant font-light">per hour</span>
              </div>

              <div className="mt-3">
                {expert.availability === 'Available Now' ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                      Available now
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-300" />
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Book a session
                    </span>
                  </span>
                )}
              </div>

              <Link
                href={bookHref}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-[11px] font-bold uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-container active:scale-[0.985]"
              >
                <span className="material-symbols-outlined text-[20px]">videocam</span>
                Book live 1:1 with {firstName}
              </Link>

              <p className="mt-3 text-[10px] text-on-surface-variant font-light leading-relaxed">
                30-minute encrypted video session • AI briefing included • Payment held until call ends
              </p>

              <dl className="mt-5 pt-5 border-t border-outline-variant/60 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-on-surface-variant/70 font-light shrink-0">Role</dt>
                  <dd className="text-on-surface text-right">{expert.role}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-on-surface-variant/70 font-light shrink-0">Organization</dt>
                  <dd className="text-on-surface text-right">{expert.employer}</dd>
                </div>
                {expert.expertise.length > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-on-surface-variant/70 font-light shrink-0">Focus</dt>
                    <dd className="text-on-surface text-right">{expert.expertise.slice(0, 2).join(', ')}</dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </section>

        {/* Expertise */}
        {expert.expertise.length > 0 && (
          <section className="mb-12">
            <div className="uppercase tracking-[0.2em] text-[10px] font-mono font-semibold text-primary mb-2">
              Expertise
            </div>
            <h2 className="text-headline-md font-semibold tracking-tight mb-4">Core disciplines</h2>
            <div className="flex flex-wrap gap-2">
              {expert.expertise.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-low px-4 py-1.5 text-sm text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-primary/70 text-[16px]" style={{ fontVariationSettings: "'wght' 600" }}>
                    check_circle
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Modalities — tie directly to landing hero promise */}
        <section className="mb-12">
          <div className="uppercase tracking-[0.2em] text-[10px] font-mono font-semibold text-primary mb-2">
            How to work with {firstName}
          </div>
          <h2 className="text-headline-md font-semibold tracking-tight mb-6">Session options</h2>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Live — active */}
            <div className="rounded-xl border-2 border-primary bg-primary-fixed/10 p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-[22px]">call</span>
                <span className="font-headline-md text-on-surface">Live 1:1 Call</span>
              </div>
              <p className="text-body-md text-on-surface-variant font-light flex-1">
                Direct face-to-face time. Book a 30-minute encrypted video session. Clear pricing, AI briefing prepared in advance.
              </p>
              <div className="mt-4 pt-4 border-t border-outline-variant/60 flex items-baseline justify-between">
                <span className="font-mono text-sm font-semibold text-on-surface">${expert.rate}/hr</span>
                <Link
                  href={bookHref}
                  className="text-[10px] font-bold uppercase tracking-wider bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-container transition-colors"
                >
                  Book 1:1 with {firstName}
                </Link>
              </div>
            </div>

            {/* Video reply — teaser */}
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 flex flex-col opacity-60">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-on-surface-variant text-[22px]">videocam</span>
                <span className="font-headline-md text-on-surface">Request a Video</span>
              </div>
              <p className="text-body-md text-on-surface-variant font-light flex-1">
                Drop a question or custom prompt. Receive a personalized recorded video reply. (Coming soon)
              </p>
              <div className="mt-auto pt-4 text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
                In development — join early access
              </div>
            </div>

            {/* Text — teaser */}
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 flex flex-col opacity-60">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-on-surface-variant text-[22px]">chat_bubble</span>
                <span className="font-headline-md text-on-surface">Text a Question</span>
              </div>
              <p className="text-body-md text-on-surface-variant font-light flex-1">
                Send a direct question. Get a real audio or text response from the expert. (Coming soon)
              </p>
              <div className="mt-auto pt-4 text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
                In development — join early access
              </div>
            </div>
          </div>
        </section>

        {/* Trust / Why book (reused language from booking + landing) */}
        <section className="border border-outline-variant/60 rounded-2xl bg-surface-container-lowest p-6 md:p-8">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary mb-2">
            The AstroLink standard
          </div>
          <h3 className="text-xl font-semibold tracking-tight mb-6">What you get with every session</h3>

          <ul className="space-y-4 text-body-md text-on-surface-variant font-light">
            {[
              { icon: 'shield', text: 'Payment held in escrow until the call ends — you only pay for value delivered' },
              { icon: 'auto_awesome', text: 'AI-generated pre-call briefing tailored to your goals and the expert’s background' },
              { icon: 'lock', text: 'Private, encrypted Daily video room with per-participant tokens' },
            ].map((item, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 pt-6 border-t border-outline-variant/50 text-xs text-on-surface-variant font-light">
            Real aerospace pedigree. Not scraped archives or statistical guesses. Direct access to the people who have flown the missions.
          </div>
        </section>
      </main>

      {/* Bottom CTA bar */}
      <div className="border-t border-outline-variant bg-surface-container-low py-6">
        <div className="max-w-[1200px] mx-auto px-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-on-surface-variant">
            Ready to get time with {expert.name}?
          </p>
          <Link
            href={bookHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-primary hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">videocam</span>
            Book 1:1 with {firstName}
          </Link>
        </div>
      </div>
    </div>
  );
}
