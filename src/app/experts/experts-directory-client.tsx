'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExpertCategoryFilter } from '@/components/booking/expert-category-filter';
import { ExpertCard } from '@/components/experts/expert-card';
import { PublicSiteHeader } from '@/components/landing/public-site-header';
import { MaterialIcon } from '@/components/ui/material-icon';
import type { DirectoryExpert } from '@/lib/directory-expert';
import { filterExpertsByCategory, filterExpertsByQuery } from '@/lib/expert-categories';

const ExpertDetailPanel = dynamic(
  () =>
    import('@/components/experts/expert-detail-panel').then((mod) => mod.ExpertDetailPanel),
  { loading: () => null },
);

const ExpertDetailSheet = dynamic(
  () =>
    import('@/components/experts/expert-detail-sheet').then((mod) => mod.ExpertDetailSheet),
  { loading: () => null },
);

export default function ExpertsDirectoryClient({
  experts,
  isSignedIn,
  waitlistMode,
}: {
  experts: DirectoryExpert[];
  isSignedIn: boolean;
  waitlistMode: boolean;
}) {
  const searchParams = useSearchParams();
  const railRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const urlQuery = searchParams.get('q');
  const [searchQuery, setSearchQuery] = useState(() => urlQuery ?? '');
  const [syncedUrlQuery, setSyncedUrlQuery] = useState(() => urlQuery);

  // Re-seed the search box from the URL when ?q= changes on the same mounted
  // route (e.g. a second hero search) — render-time adjustment, not an effect,
  // so the user's own edits to the box aren't clobbered on every render.
  if (urlQuery !== syncedUrlQuery) {
    setSyncedUrlQuery(urlQuery);
    setSearchQuery(urlQuery ?? '');
  }

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const filteredExperts = useMemo(
    () => filterExpertsByQuery(filterExpertsByCategory(experts, selectedCategory), searchQuery),
    [experts, selectedCategory, searchQuery],
  );

  const selectedExpert = useMemo(
    () => experts.find((e) => e.slug === selectedSlug) ?? null,
    [experts, selectedSlug],
  );

  const handleSelect = useCallback((slug: string) => {
    setSelectedSlug((prev) => (prev === slug ? null : slug));
  }, []);

  const handleClose = useCallback(() => {
    setSelectedSlug(null);
  }, []);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSlug(null);
  };

  const scrollRail = (direction: -1 | 1) => {
    const node = railRef.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>('[data-rail-card]');
    const delta = (card?.offsetWidth ?? 240) + 16;
    node.scrollBy({ left: direction * delta, behavior: 'smooth' });
  };

  return (
    <div className="experts-directory landing-mission min-h-screen overflow-x-hidden bg-[var(--landing-surface)] text-[var(--landing-text)] font-landing-body selection:bg-[color:var(--landing-accent)]/20">
      <PublicSiteHeader variant="landing" />

      <main>
        <section className="experts-dir-hero">
          <p className="experts-dir-hero__eyebrow">Verified directory</p>
          <h1>Talk to people who&apos;ve done the work.</h1>
          <p>
            Watch intro videos, read bios, and book live 1:1 sessions — starting at 15 minutes.
          </p>
        </section>

        <div className="experts-dir-filters">
          <ExpertCategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            variant="underline"
          />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, role, or expertise"
            aria-label="Search experts"
            data-testid="experts-dir-search"
            className="experts-dir-search"
          />
        </div>

        {filteredExperts.length === 0 ? (
          <p className="experts-dir-empty">
            {searchQuery.trim()
              ? `No experts match "${searchQuery.trim()}".`
              : 'No listed experts in this category right now.'}
          </p>
        ) : (
          <div className="experts-dir-rail-wrap">
            <div className="experts-dir-rail-controls" aria-hidden={false}>
              <button
                type="button"
                className="experts-dir-rail-btn"
                aria-label="Previous experts"
                onClick={() => scrollRail(-1)}
              >
                <MaterialIcon name="chevron_left" size={22} />
              </button>
              <button
                type="button"
                className="experts-dir-rail-btn"
                aria-label="Next experts"
                onClick={() => scrollRail(1)}
              >
                <MaterialIcon name="chevron_right" size={22} />
              </button>
            </div>
            <div ref={railRef} className="experts-dir-rail" data-testid="experts-dir-rail">
              {filteredExperts.map((expert, index) => (
                <div key={expert.id} className="experts-dir-rail-item" data-rail-card>
                  <ExpertCard
                    expert={expert}
                    isSelected={selectedSlug === expert.slug}
                    isHovered={hoveredSlug === expert.slug}
                    onSelect={() => handleSelect(expert.slug)}
                    onHover={(hovered) => setHoveredSlug(hovered ? expert.slug : null)}
                    priority={index < 4}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedExpert && isDesktop ? (
          <ExpertDetailPanel
            expert={selectedExpert}
            isSignedIn={isSignedIn}
            waitlistMode={waitlistMode}
            onClose={handleClose}
          />
        ) : null}

        {selectedExpert && !isDesktop ? (
          <ExpertDetailSheet
            expert={selectedExpert}
            isSignedIn={isSignedIn}
            waitlistMode={waitlistMode}
            onClose={handleClose}
          />
        ) : null}
      </main>

      <footer className="border-t border-[color:var(--landing-border)] bg-[var(--landing-surface)] py-10 sm:py-16 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pb-16">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg flex flex-col sm:flex-row justify-between items-center gap-5 sm:gap-6">
          <Link href="/" className="font-landing-wordmark text-sm text-[var(--landing-text)]">
            AstroLink
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-[var(--landing-muted)] text-xs">
            <Link
              href="/for-educators"
              className="inline-flex min-h-10 touch-manipulation items-center px-2.5 hover:text-[var(--landing-text)] transition-colors sm:min-h-0"
            >
              For Educators
            </Link>
            <Link
              href="/press"
              className="inline-flex min-h-10 touch-manipulation items-center px-2.5 hover:text-[var(--landing-text)] transition-colors sm:min-h-0"
            >
              Press
            </Link>
            <Link
              href="/privacy"
              className="inline-flex min-h-10 touch-manipulation items-center px-2.5 hover:text-[var(--landing-text)] transition-colors sm:min-h-0"
            >
              Privacy
            </Link>
            <span className="px-2.5 py-2 sm:py-0">© 2026 AstroLink</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
