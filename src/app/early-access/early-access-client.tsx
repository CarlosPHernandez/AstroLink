'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { parseEarlyAccessReferrer } from '@/lib/early-access-referrer';

const CHRIS = {
  name: 'Chris Sembroski',
  title: 'Inspiration4 Astronaut & Aerospace Engineer',
  employer: 'Inspiration4 · Lockheed Martin · Starfish Space',
  bio: 'Commercial astronaut who flew on Inspiration4. Expert in payload integration and flight mechanics for private astronaut operations.',
  expertise: ['Commercial Spaceflight', 'Payload Integration', 'Flight Mechanics'],
  imageSrc: '/chris_sembroski.jpeg',
};

const fieldClass =
  'w-full bg-surface-container-lowest border border-outline-variant rounded-md px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all';

function ChrisPortrait({
  className,
  sizes,
  priority,
  imageFailed,
  onImageError,
}: {
  className: string;
  sizes: string;
  priority?: boolean;
  imageFailed: boolean;
  onImageError: () => void;
}) {
  if (imageFailed) {
    return (
      <div
        className={`${className} flex flex-col items-center justify-center bg-gradient-to-br from-primary-fixed via-primary-container/30 to-tertiary-container/40`}
      >
        <span className="material-symbols-outlined text-primary mb-sm" style={{ fontSize: 56 }}>
          rocket_launch
        </span>
        <span className="text-headline-md font-bold text-on-primary-fixed">CS</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <Image
        src={CHRIS.imageSrc}
        alt={CHRIS.name}
        fill
        className="object-cover object-top"
        sizes={sizes}
        priority={priority}
        onError={onImageError}
      />
    </div>
  );
}

export default function EarlyAccessClient({ copyrightYear }: { copyrightYear: number }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setMessage(null);

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldError('Enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
      const referrer =
        typeof window !== 'undefined'
          ? parseEarlyAccessReferrer(window.location.search)
          : undefined;

      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed.toLowerCase(),
          referrer,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !data.success) {
        setStatus('error');
        setMessage(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      setMessage(data.message ?? "You're on the list. We'll be in touch soon.");
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">
      <header className="border-b border-outline-variant bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg h-16 sm:h-20 flex justify-between items-center">
          <Link href="/" className="font-bold text-lg tracking-tight text-on-surface hover:text-primary transition-colors">
            AstroLink
          </Link>
          <span className="text-label-sm uppercase tracking-wider text-primary font-semibold bg-primary-fixed/40 px-3 py-1 rounded-full">
            Early access
          </span>
        </div>
      </header>

      <main>
        <section className="max-w-[1200px] mx-auto px-md sm:px-lg pt-xl sm:pt-xxl pb-lg relative">
          <div
            className="absolute top-0 right-0 w-[min(100%,420px)] h-[420px] bg-gradient-to-bl from-primary-container/10 via-secondary-container/5 to-transparent blur-3xl rounded-full -z-10 pointer-events-none"
            aria-hidden
          />

          <div className="grid lg:grid-cols-2 gap-xl lg:gap-xxl items-center">
            <div className="w-full min-w-0 order-2 lg:order-1">
              <p className="text-label-md text-primary font-semibold uppercase tracking-wider mb-sm animate-reveal-up">
                Aerospace expert network
              </p>
              <h1 className="text-headline-lg-mobile sm:text-display text-on-surface font-bold tracking-tight mb-md animate-reveal-up delay-100">
                Talk to the people who&apos;ve actually been there.
              </h1>
              <p className="text-body-lg text-on-surface-variant leading-relaxed animate-reveal-up delay-200">
                AstroLink connects you with verified aerospace professionals for live, one-on-one video
                sessions — astronauts, flight controllers, and operators who have done the work in orbit
                and on the ground.
              </p>
              <a
                href="#signup"
                className="inline-flex mt-lg items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-md font-label-md font-semibold hover:bg-primary-container transition-all active:scale-[0.99] shadow-sm animate-reveal-up delay-300"
              >
                Join the waitlist
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  arrow_downward
                </span>
              </a>
            </div>

            <div
              className="w-full min-w-0 order-1 lg:order-2 animate-reveal-up delay-200"
              data-testid="early-access-hero-portrait"
            >
              <div className="relative mx-auto w-full max-w-[420px] aspect-[4/5] rounded-2xl overflow-hidden border border-outline-variant floating-card-shadow bg-surface-container-low">
                <ChrisPortrait
                  className="absolute inset-0"
                  sizes="(max-width: 1024px) 90vw, 420px"
                  priority
                  imageFailed={imageFailed}
                  onImageError={() => setImageFailed(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/85 via-inverse-surface/20 to-transparent pointer-events-none" />
                <div className="absolute top-md left-md flex items-center gap-xs bg-surface-container-lowest/95 backdrop-blur-sm border border-outline-variant/50 rounded-full px-3 py-1.5 shadow-sm">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>
                    verified
                  </span>
                  <span className="text-label-sm font-semibold text-on-surface uppercase tracking-wide">
                    Verified astronaut
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-lg sm:p-xl">
                  <p className="text-label-sm text-inverse-on-surface/80 uppercase tracking-wider font-mono mb-xs">
                    Featured on AstroLink
                  </p>
                  <p className="text-headline-md sm:text-headline-lg font-bold text-inverse-on-surface tracking-tight">
                    {CHRIS.name}
                  </p>
                  <p className="text-label-md text-inverse-on-surface/90 mt-xs">{CHRIS.title}</p>
                </div>
              </div>
            </div>
          </div>

          <ul className="mt-xl grid sm:grid-cols-3 gap-md animate-reveal-up delay-400">
            {[
              {
                icon: 'verified',
                title: 'Verified pedigree',
                body: 'Every expert is vetted — real missions, real employers, real expertise.',
              },
              {
                icon: 'videocam',
                title: 'Live 1:1 sessions',
                body: 'Book focused video time. No forums, no guesswork — direct access.',
              },
              {
                icon: 'rocket_launch',
                title: 'Built for aerospace',
                body: 'From commercial spaceflight to payload integration, ask what matters to you.',
              },
            ].map((item) => (
              <li
                key={item.title}
                className="bg-surface-container-low border border-outline-variant/60 rounded-lg p-md"
              >
                <span className="material-symbols-outlined text-primary mb-sm" style={{ fontSize: 28 }}>
                  {item.icon}
                </span>
                <h2 className="text-label-md font-semibold text-on-surface mb-xs">{item.title}</h2>
                <p className="text-body-md text-on-surface-variant">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-surface-container-low border-y border-outline-variant">
          <div className="max-w-[1200px] mx-auto px-md sm:px-lg py-xl sm:py-xxl">
            <div className="grid lg:grid-cols-2 gap-xl items-start">
              <div className="order-2 lg:order-1 w-full min-w-0">
                <p className="text-label-md text-primary font-semibold uppercase tracking-wider mb-sm">
                  Featured expert
                </p>
                <h2 className="text-headline-md sm:text-headline-lg text-on-surface font-bold tracking-tight mb-sm">
                  The caliber on AstroLink
                </h2>
                <p className="text-body-lg text-on-surface-variant mb-lg leading-relaxed">
                  Chris is the standard, not the exception. Our roster brings together people who have
                  flown missions, run operations, and built hardware—from human spaceflight and defense
                  aerospace to today&apos;s commercial space economy.
                </p>

                <article
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg floating-card-shadow"
                  data-testid="featured-expert-chris-sembroski"
                >
                  <div className="flex gap-md items-start">
                    <ChrisPortrait
                      className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-outline-variant"
                      sizes="96px"
                      imageFailed={imageFailed}
                      onImageError={() => setImageFailed(true)}
                    />
                    <div className="min-w-0">
                      <h3 className="text-headline-md font-semibold text-on-surface">{CHRIS.name}</h3>
                      <p className="text-label-md text-primary font-medium mt-xs">{CHRIS.title}</p>
                      <p className="text-label-sm text-on-surface-variant mt-xs">{CHRIS.employer}</p>
                    </div>
                  </div>
                  <p className="text-body-md text-on-surface-variant mt-md leading-relaxed">{CHRIS.bio}</p>
                  <ul className="flex flex-wrap gap-xs mt-md">
                    {CHRIS.expertise.map((tag) => (
                      <li
                        key={tag}
                        className="text-label-sm px-3 py-1 rounded-full bg-primary-fixed/50 text-on-primary-fixed border border-outline-variant/40"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>

              <div className="order-1 lg:order-2 w-full min-w-0">
                <div
                  id="signup"
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg sm:p-xl floating-card-shadow scroll-mt-24"
                >
                  <h2 className="text-headline-md font-semibold text-on-surface mb-xs">
                    Request early access
                  </h2>
                  <p className="text-body-md text-on-surface-variant mb-lg">
                    Be first to book sessions when we open the platform. We&apos;ll only use your email
                    to follow up about early access — no spam.
                  </p>

                  {status === 'success' ? (
                    <div
                      className="p-md rounded-lg bg-primary-fixed/30 border border-primary/20 animate-fade-in"
                      data-testid="early-access-success"
                      role="status"
                    >
                      <div className="flex gap-sm items-start">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>
                          check_circle
                        </span>
                        <p className="text-body-md text-on-surface font-medium">{message}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setStatus('idle');
                          setMessage(null);
                        }}
                        className="mt-md text-label-md text-primary hover:underline cursor-pointer"
                      >
                        Add another email
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-md" data-testid="early-access-form">
                      <div>
                        <label htmlFor="early-access-email" className="sr-only">
                          Email address
                        </label>
                        <input
                          id="early-access-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setFieldError(null);
                          }}
                          disabled={status === 'loading'}
                          className={fieldClass}
                          aria-invalid={fieldError ? true : undefined}
                          aria-describedby={fieldError ? 'early-access-email-error' : undefined}
                        />
                        {fieldError && (
                          <p id="early-access-email-error" className="mt-xs text-label-sm text-error">
                            {fieldError}
                          </p>
                        )}
                      </div>

                      {status === 'error' && message && (
                        <p className="text-label-sm text-error" role="alert">
                          {message}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-primary text-on-primary py-3 px-lg rounded-md font-label-md font-semibold hover:bg-primary-container disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.99] shadow-sm"
                      >
                        {status === 'loading' ? 'Joining…' : 'Join the waitlist'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant py-lg">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg flex flex-col sm:flex-row justify-between items-center gap-sm text-label-sm text-on-surface-variant">
          <span>© {copyrightYear} AstroLink</span>
          <Link href="/" className="hover:text-primary transition-colors">
            Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}
