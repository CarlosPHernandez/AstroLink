'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExpertCategoryFilter } from '@/components/booking/expert-category-filter';
import { ExpertCard } from '@/components/experts/expert-card';
import { LandingAuthNavClient } from '@/components/landing/landing-auth-nav-client';
import { filterExpertsByCategory } from '@/lib/expert-categories';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const filteredExperts = useMemo(
    () => filterExpertsByCategory(experts, selectedCategory),
    [experts, selectedCategory],
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
    <div className="min-h-screen bg-background text-on-surface font-sans">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-outline-variant">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg h-20 flex justify-between items-center w-full">
          <Link href="/" className="font-bold text-lg text-on-surface tracking-tight">
            AstroLink
          </Link>
          <LandingAuthNavClient />
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-md sm:px-lg py-10 sm:py-14">
        <div className="mb-10">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-primary mb-2">
            Verified directory
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
            Browse aerospace experts
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant font-light max-w-2xl">
            Watch intro videos, read bios, and book live 1:1 sessions with astronauts, flight
            controllers, and operators.
          </p>
        </div>

        <div className="mb-8">
          <ExpertCategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {filteredExperts.length === 0 ? (
          <p className="text-sm text-on-surface-variant font-light py-12">
            No listed experts in this category right now.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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