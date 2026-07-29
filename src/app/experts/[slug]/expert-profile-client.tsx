'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { DurationStepper } from '@/components/experts/duration-stepper';
import { ExpertIntroMedia } from '@/components/ExpertIntroMedia';
import { MaterialIcon } from '@/components/ui/material-icon';
import { computeDurationPriceCents } from '@/lib/booking-pricing';
import { getExpertBookHref } from '@/lib/expert-book-href';
import type { ExpertCta } from '@/lib/expert-cta';
import type { ListedExpert } from '@/lib/mentor-directory';
import {
  SESSION_DURATION_DEFAULT,
  formatUsdFromCents,
} from '@/lib/session-duration';

interface SessionData {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
}

export default function ExpertProfileClient({
  expert,
  session,
  expertCta,
}: {
  expert: ListedExpert;
  session: SessionData | null;
  expertCta: ExpertCta;
}) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(SESSION_DURATION_DEFAULT);

  const firstName = expert.name.split(' ')[0];
  const isWaitlist = expertCta.variant === 'waitlist';
  const isSignedIn = Boolean(session);
  const videoOfferActive =
    !isWaitlist &&
    Boolean(expert.videoRequestsEnabled) &&
    (expert.videoRequestPriceCents ?? 0) > 0;
  const videoPriceLabel = formatUsdFromCents(expert.videoRequestPriceCents ?? 0);
  const videoHref = `/experts/${expert.slug}/video-request`;
  const slaDays = expert.videoRequestSlaDays ?? 7;

  const bookHref = useMemo(() => {
    if (isWaitlist) return expertCta.href;
    return getExpertBookHref(expert.slug, isSignedIn, durationMinutes);
  }, [expert.slug, expertCta.href, isSignedIn, isWaitlist, durationMinutes]);

  const sessionPriceCents = computeDurationPriceCents(
    expert.liveSessionPriceCents,
    durationMinutes,
  );
  const priceLabel = formatUsdFromCents(sessionPriceCents);

  const primaryCtaLabel = isWaitlist
    ? 'Get early access'
    : `Book ${durationMinutes} min · ${priceLabel}`;
  const headerCtaLabel = isWaitlist ? 'Get early access' : 'Book session';
  const compactCtaLabel = isWaitlist
    ? 'Get early access'
    : `Book with ${firstName}`;
  const videoCtaLabel = `Get a video from ${firstName} · ${videoPriceLabel}`;

  const paragraphs = expert.bio.split('\n').filter(Boolean);
  const COLLAPSE_AT = 3;
  const visibleParas = bioExpanded ? paragraphs : paragraphs.slice(0, COLLAPSE_AT);

  return (
    <div className="experts-profile min-h-screen">
      <header className="experts-pro-header">
        <div className="experts-pro-header__inner">
          <Link href="/" className="experts-pro-logo">
            AstroLink
          </Link>

          <div className="experts-pro-header__nav">
            <Link href="/experts" className="experts-pro-dir-link">
              <MaterialIcon name="arrow_back" size={18} />
              <span className="hidden sm:inline">Directory</span>
            </Link>

            <Link
              href={bookHref}
              data-testid="expert-profile-book"
              className="experts-pro-header-cta"
            >
              {headerCtaLabel}
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
                className="experts-pro-text-link"
              >
                Dashboard
              </Link>
            ) : (
              <Link href="/auth" className="experts-pro-text-link">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="experts-pro-main">
        <div className="experts-pro-hero">
          <div className="experts-pro-portrait">
            <ExpertIntroMedia
              name={expert.name}
              imageUrl={expert.imageUrl}
              introVideoUrl={expert.introVideoUrl}
              className="experts-pro-media"
              priority
              overlayVariant="minimal"
            />
          </div>

          <div className="experts-pro-copy">
            <p className="experts-pro-eyebrow">AstroLink expert</p>
            <h1 data-testid="expert-profile-name">{expert.name}</h1>
            <p className="experts-pro-role">{expert.role}</p>
            <p className="experts-pro-employer">{expert.employer}</p>
            <p className="experts-pro-lede">
              A private session with someone who has done the work — prepared on your goals,
              without the conference circuit.
            </p>

            <div className="experts-pro-book" id="book">
              {!isWaitlist ? (
                <>
                  <DurationStepper value={durationMinutes} onChange={setDurationMinutes} />

                  <div className="experts-pro-price">
                    <p className="experts-pro-price__total">
                      {priceLabel}
                      <span>session</span>
                    </p>
                    <p className="experts-pro-price__rate">
                      ${expert.rate}/hr · prorated to {durationMinutes} min
                    </p>
                  </div>
                </>
              ) : null}

              <Link href={bookHref} className="experts-pro-book-cta" data-testid="expert-profile-book-cta">
                {primaryCtaLabel}
              </Link>

              <p className="experts-pro-book-note">
                Encrypted video · AI briefing included · Refundable up to 24 hours before start
              </p>

              {videoOfferActive ? (
                <div className="experts-pro-video-offer" data-testid="expert-profile-video-offer">
                  <p className="experts-pro-section-label" style={{ marginTop: '1.25rem' }}>
                    Or a personal video
                  </p>
                  <p className="experts-pro-book-note" style={{ marginBottom: '0.65rem' }}>
                    A short private message from {firstName} · usually within {slaDays} days ·{' '}
                    {videoPriceLabel}
                  </p>
                  <Link
                    href={videoHref}
                    data-testid="expert-profile-video-cta"
                    className="experts-pro-video-cta"
                  >
                    {videoCtaLabel}
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <section className="experts-pro-bio">
          <p className="experts-pro-section-label">The pedigree</p>
          <h2>About {firstName}</h2>
          <div lang="es" className="experts-pro-bio-body">
            {visibleParas.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {paragraphs.length > COLLAPSE_AT ? (
            <button
              type="button"
              onClick={() => setBioExpanded((v) => !v)}
              className="experts-pro-bio-toggle"
            >
              <MaterialIcon name={bioExpanded ? 'expand_less' : 'expand_more'} size={16} />
              {bioExpanded ? 'Read less' : 'Read more'}
            </button>
          ) : null}
        </section>

        {expert.expertise.length > 0 ? (
          <section className="experts-pro-disciplines">
            <h2>Core disciplines</h2>
            <div className="experts-pro-chips">
              {expert.expertise.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </section>
        ) : null}

        <section className="experts-pro-trust">
          <p className="experts-pro-section-label">The AstroLink standard</p>
          <h2>What you get with every session</h2>
          <ul>
            {[
              'Payment collected when you book; full refund when cancelled at least 24 hours before start',
              'AI-generated pre-call briefing tailored to your goals and the expert’s background',
              'Private, encrypted Daily video room with per-participant tokens',
            ].map((text) => (
              <li key={text}>
                <MaterialIcon name="check_circle" size={18} className="experts-pro-trust-icon" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <div className="experts-pro-sticky-bar">
        <div className="experts-pro-sticky-bar__inner">
          <p>
            {isWaitlist
              ? `Join early access for sessions with ${firstName}.`
              : `${durationMinutes} min with ${firstName} · ${priceLabel}`}
          </p>
          <div className="experts-pro-sticky-bar__actions">
            {videoOfferActive ? (
              <Link
                href={videoHref}
                className="experts-pro-video-cta experts-pro-video-cta--compact"
                data-testid="expert-profile-video-cta-sticky"
              >
                Video · {videoPriceLabel}
              </Link>
            ) : null}
            <Link href={bookHref} className="experts-pro-book-cta experts-pro-book-cta--compact">
              {compactCtaLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
