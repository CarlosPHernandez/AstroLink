'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DurationStepper } from '@/components/experts/duration-stepper';
import { ExpertBookAuthSheet } from '@/components/experts/expert-book-auth-sheet';
import { ExpertReviews } from '@/components/experts/expert-reviews';
import { ProfileBottomSheet } from '@/components/experts/profile-bottom-sheet';
import { ExpertIntroMedia } from '@/components/ExpertIntroMedia';
import { MaterialIcon } from '@/components/ui/material-icon';
import { computeDurationPriceCents, formatFifteenMinuteRate } from '@/lib/booking-pricing';
import { getExpertBookHref } from '@/lib/expert-book-href';
import type { ExpertCta } from '@/lib/expert-cta';
import type { PublicExpertReview } from '@/lib/expert-reviews';
import { publicExpertCopyForSlug } from '@/lib/experts/public-expert-copy';
import type { ListedExpert } from '@/lib/mentor-directory';
import {
  SESSION_DURATION_DEFAULT,
  SESSION_DURATION_MAX,
  SESSION_DURATION_MIN,
  SESSION_DURATION_STEP,
  formatUsdFromCents,
} from '@/lib/session-duration';

const DURATION_OPTIONS: number[] = [];
for (
  let minutes = SESSION_DURATION_MIN;
  minutes <= SESSION_DURATION_MAX;
  minutes += SESSION_DURATION_STEP
) {
  DURATION_OPTIONS.push(minutes);
}

const WHAT_YOU_GET = [
  '1:1 Video session',
  'Meeting transcript',
  'Actionable next steps',
  'Expert provided resources',
];

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
  reviews = [],
  supabaseAuth = false,
}: {
  expert: ListedExpert;
  session: SessionData | null;
  expertCta: ExpertCta;
  reviews?: PublicExpertReview[];
  supabaseAuth?: boolean;
}) {
  const router = useRouter();
  const [bioExpanded, setBioExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(SESSION_DURATION_DEFAULT);

  const firstName = expert.name.split(' ')[0];
  const isWaitlist = expertCta.variant === 'waitlist';
  const isSignedIn = Boolean(session);
  const videoOfferActive =
    !isWaitlist &&
    Boolean(expert.videoRequestsEnabled) &&
    (expert.videoRequestPriceCents ?? 0) > 0;
  const videoHref = `/experts/${expert.slug}/video-request`;

  const bookingPath = useMemo(
    () => getExpertBookHref(expert.slug, true, durationMinutes),
    [expert.slug, durationMinutes],
  );

  const openBooking = () => {
    if (isWaitlist) {
      router.push(expertCta.href);
      return;
    }
    if (isSignedIn) {
      router.push(bookingPath);
      return;
    }
    setAuthOpen(true);
  };

  const sessionPriceCents = computeDurationPriceCents(
    expert.liveSessionPriceCents,
    durationMinutes,
  );
  const priceLabel = formatUsdFromCents(sessionPriceCents);

  const primaryCtaLabel = isWaitlist
    ? 'Get early access'
    : `Book ${durationMinutes} min · ${priceLabel}`;
  const headerCtaLabel = isWaitlist ? 'Get early access' : 'Book session';
  const mobileCtaLabel = isWaitlist ? 'Join' : 'Book';
  const compactCtaLabel = isWaitlist
    ? 'Get early access'
    : `Book with ${firstName}`;
  const videoCtaLabel = 'Get a personalized video';
  const dashboardHref = session
    ? session.role === 'admin'
      ? '/dashboard/admin'
      : session.role === 'mentor'
        ? '/dashboard/mentor'
        : '/dashboard/mentee'
    : '/auth';
  const ratingAverage =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10,
        ) / 10
      : null;

  const paragraphs = expert.bio.split('\n').filter(Boolean);
  const COLLAPSE_AT = 1;
  const visibleParas = bioExpanded ? paragraphs : paragraphs.slice(0, COLLAPSE_AT);
  const topicTags = expert.expertise.slice(0, 3);
  const expertCopy = publicExpertCopyForSlug(expert.slug);
  const primaryTopic = topicTags[0] ?? expert.category;
  const sessionPreviewItems = [
    {
      label: 'Bring one decision',
      text:
        expertCopy?.question ??
        `Use the time to pressure-test a real next move in ${primaryTopic}.`,
    },
    {
      label: 'Use their field context',
      text: expertCopy?.proof ?? `${expert.role}${expert.employer ? ` at ${expert.employer}` : ''}.`,
    },
    {
      label: 'Leave with a plan',
      text: 'Walk away with next steps, useful resources, and a clearer path for what to do after the call.',
    },
  ];

  return (
    <div className="experts-profile experts-profile--light min-h-screen">
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

            <button
              type="button"
              data-testid="expert-profile-book"
              className="experts-pro-header-cta"
              onClick={openBooking}
            >
              <span className="experts-pro-header-cta__full">{headerCtaLabel}</span>
              <span className="experts-pro-header-cta__short">{mobileCtaLabel}</span>
            </button>

            {session ? (
              <Link href={dashboardHref} className="experts-pro-text-link">
                Dashboard
              </Link>
            ) : (
              <Link href="/auth" className="experts-pro-text-link">
                Sign In
              </Link>
            )}

            <button
              type="button"
              className="experts-pro-m-menu-btn"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MaterialIcon name={menuOpen ? 'close' : 'menu'} size={24} />
            </button>
          </div>
        </div>
        {menuOpen ? (
          <nav className="experts-pro-m-menu" aria-label="Profile menu">
            <Link href="/experts" onClick={() => setMenuOpen(false)}>
              Directory
            </Link>
            {session ? (
              <Link href={dashboardHref} onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
            ) : (
              <Link href="/auth" onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
            )}
          </nav>
        ) : null}
      </header>

      <main className="experts-pro-main">
        <div className="experts-pro-cover">
          <ExpertIntroMedia
            name={expert.name}
            imageUrl={expert.imageUrl}
            introVideoUrl={expert.introVideoUrl}
            className="experts-pro-media"
            priority
            overlayVariant="minimal"
            hideLabel
          />
          <div className="experts-pro-cover-dimmer" aria-hidden />
          <div className="experts-pro-cover-gradient" aria-hidden />
          <div className="experts-pro-cover-overlay">
            <span className="experts-pro-cover-badge">Verified AstroLink expert</span>
            <h1 data-testid="expert-profile-name">{expert.name}</h1>
            <p className="experts-pro-cover-role">{expert.role}</p>
            {expert.employer ? (
              <p className="experts-pro-cover-employer">{expert.employer}</p>
            ) : null}
          </div>
        </div>

        <div className="experts-pro-m-identity">
          <div className="experts-pro-m-identity__row">
            <div className="experts-pro-m-identity__copy">
              <div className="experts-pro-m-name-row">
                <h1 className="experts-pro-m-name">{expert.name}</h1>
                <MaterialIcon name="verified" size={18} className="experts-pro-m-verified" />
              </div>
              <div className={`experts-pro-m-bio${bioExpanded ? ' is-open' : ''}`}>
                {(bioExpanded ? paragraphs : paragraphs.slice(0, 1)).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              {paragraphs.join(' ').length > 120 ? (
                <button
                  type="button"
                  className="experts-pro-m-more"
                  onClick={() => setBioExpanded((open) => !open)}
                >
                  {bioExpanded ? 'Show less' : 'Read More'}
                </button>
              ) : null}
            </div>
            {ratingAverage != null ? (
              <a
                href="#reviews"
                className="experts-pro-m-rating"
                aria-label={`Rated ${ratingAverage} out of 5. Jump to reviews.`}
              >
                <MaterialIcon name="star" size={20} className="experts-pro-m-star" />
                <span>{ratingAverage.toFixed(1)}</span>
              </a>
            ) : null}
          </div>
          <section className="experts-pro-m-gets" aria-label="What you get">
            <p className="experts-pro-m-gets-label">What you get</p>
            <ul>
              {WHAT_YOU_GET.map((item) => (
                <li key={item}>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="experts-pro-body">
          <div className="experts-pro-left">
            <p className="experts-pro-intro experts-pro-mobile-defer">
              A private session with someone who has done the work — prepared on your goals,
              without the conference circuit.
            </p>

            {topicTags.length > 0 ? (
              <div className="experts-pro-chips experts-pro-tags">
                {topicTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : null}

            <div className="experts-pro-mobile-defer">
              <p className="experts-pro-section-label">What you can ask about</p>
              <ul className="experts-pro-ask-list">
                <li>Breaking into aerospace without a traditional background</li>
                <li>What flight training and mission prep actually involve</li>
                <li>Realistic timelines for a career pivot into space</li>
              </ul>
            </div>

            <section className="experts-pro-bio">
              <p className="experts-pro-section-label experts-pro-mobile-defer">The pedigree</p>
              <h2>About {firstName}</h2>
              <div className="experts-pro-bio-body">
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
              <section className="experts-pro-disciplines experts-pro-mobile-defer">
                <h2>Core disciplines</h2>
                <div className="experts-pro-chips">
                  {expert.expertise.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </section>
            ) : null}

            <div id="reviews">
              <ExpertReviews reviews={reviews} />
            </div>

            {reviews.length === 0 ? (
              <section className="experts-pro-session-plan" data-testid="expert-profile-session-plan">
                <p className="experts-pro-section-label">Session preview</p>
                <h2>Make the first conversation count</h2>
                <p className="experts-pro-session-plan__lede">
                  This profile is new to public session feedback, so here is the practical way to
                  use the time with {firstName}.
                </p>
                <ul>
                  {sessionPreviewItems.map((item) => (
                    <li key={item.label}>
                      <span>{item.label}</span>
                      <p>{item.text}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="experts-pro-trust experts-pro-mobile-defer">
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
          </div>

          <div className="experts-pro-booking-card" id="book">
            {!isWaitlist ? (
              <>
                <DurationStepper value={durationMinutes} onChange={setDurationMinutes} />

                <div className="experts-pro-price">
                  <p className="experts-pro-price__total">
                    {priceLabel}
                    <span>session</span>
                  </p>
                  <p className="experts-pro-price__rate">
                    {formatFifteenMinuteRate(expert.liveSessionPriceCents)} · prorated to{' '}
                    {durationMinutes} min
                  </p>
                </div>
              </>
            ) : null}

            <button
              type="button"
              className="experts-pro-book-cta experts-pro-book-cta--desktop"
              data-testid="expert-profile-book-cta"
              onClick={openBooking}
            >
              {primaryCtaLabel}
            </button>

            <p className="experts-pro-book-note">
              Encrypted video · AI briefing included · Refundable up to 24 hours before start
            </p>

            {videoOfferActive ? (
              <div className="experts-pro-video-offer" data-testid="expert-profile-video-offer">
                <Link
                  href={videoHref}
                  data-testid="expert-profile-video-cta"
                  className="experts-pro-video-cta"
                  style={{ marginTop: '0.85rem' }}
                >
                  {videoCtaLabel}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <div className="experts-pro-sticky-bar">
        <div className="experts-pro-sticky-bar__inner">
          {isWaitlist ? (
            <p>Join early access for sessions with {firstName}.</p>
          ) : (
            <button
              type="button"
              className="experts-pro-m-duration"
              onClick={() => setDurationOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={durationOpen}
            >
              <span className="experts-pro-m-duration__time">{durationMinutes} min</span>
              <span className="experts-pro-m-duration__price">{priceLabel}</span>
              <MaterialIcon name="expand_more" size={20} aria-hidden />
            </button>
          )}
          <div className="experts-pro-sticky-bar__actions">
            {videoOfferActive ? (
              <Link
                href={videoHref}
                className="experts-pro-book-cta experts-pro-book-cta--compact experts-pro-sticky-video"
                data-testid="expert-profile-video-cta-sticky"
              >
                Personalized video
              </Link>
            ) : null}
            <button
              type="button"
              className="experts-pro-book-cta experts-pro-book-cta--compact experts-pro-m-book"
              onClick={openBooking}
            >
              <span className="experts-pro-m-book__full">{compactCtaLabel}</span>
              <span className="experts-pro-m-book__short">{mobileCtaLabel}</span>
            </button>
          </div>
        </div>
      </div>

      {durationOpen && !isWaitlist ? (
        <ProfileBottomSheet
          title="Session length"
          onClose={() => setDurationOpen(false)}
          testId="expert-duration-sheet"
        >
          <p className="experts-pro-sheet__lede">Choose how long you want with {firstName}.</p>
          <div className="experts-pro-duration-grid">
            {DURATION_OPTIONS.map((minutes) => {
              const optionPrice = formatUsdFromCents(
                computeDurationPriceCents(expert.liveSessionPriceCents, minutes),
              );
              const selected = minutes === durationMinutes;
              return (
                <button
                  key={minutes}
                  type="button"
                  className={`experts-pro-duration-option${selected ? ' is-selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() => {
                    setDurationMinutes(minutes);
                    setDurationOpen(false);
                  }}
                >
                  <span className="experts-pro-duration-option__mins">{minutes}</span>
                  <span className="experts-pro-duration-option__unit">minutes</span>
                  <span className="experts-pro-duration-option__price">{optionPrice}</span>
                </button>
              );
            })}
          </div>
        </ProfileBottomSheet>
      ) : null}

      {authOpen ? (
        <ExpertBookAuthSheet
          redirectPath={bookingPath}
          supabaseAuth={supabaseAuth}
          onClose={() => setAuthOpen(false)}
        />
      ) : null}
    </div>
  );
}
