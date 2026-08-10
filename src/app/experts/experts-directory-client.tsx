'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExpertCategoryFilter } from '@/components/booking/expert-category-filter';
import { ExpertCard } from '@/components/experts/expert-card';
import { PublicSiteHeader } from '@/components/landing/public-site-header';
import { filterExpertsByCategory, filterExpertsByQuery } from '@/lib/expert-categories';
import type { ListedExpert } from '@/lib/mentor-directory';

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
  experts: ListedExpert[];
  isSignedIn: boolean;
  waitlistMode: boolean;
}) {
  const searchParams = useSearchParams();
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

  return (
    <div className="experts-directory min-h-screen">
      <PublicSiteHeader variant="landing" />

      <main>
        <section className="experts-dir-hero">
          <p className="experts-dir-hero__eyebrow">Verified directory</p>
          <h1>Aerospace experts</h1>
          <p>
            Watch intro videos, read bios, and book live 1:1 sessions with people who have done the
            work.
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
          <div className="experts-dir-grid">
            {filteredExperts.map((expert, index) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                isSelected={selectedSlug === expert.slug}
                isHovered={hoveredSlug === expert.slug}
                onSelect={() => handleSelect(expert.slug)}
                onHover={(hovered) => setHoveredSlug(hovered ? expert.slug : null)}
                priority={index === 0}
              />
            ))}
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
    </div>
  );
}
