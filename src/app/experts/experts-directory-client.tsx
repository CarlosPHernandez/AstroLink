'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExpertCard } from '@/components/experts/expert-card';
import { ExpertDetailPanel } from '@/components/experts/expert-detail-panel';
import { ExpertDetailSheet } from '@/components/experts/expert-detail-sheet';
import { LandingAuthNavClient } from '@/components/landing/landing-auth-nav-client';
import type { ListedExpert } from '@/lib/mentor-directory';

const CATEGORIES = ['all', 'systems', 'propulsion', 'spacecraft', 'policy'] as const;

type SessionData = {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
};

export default function ExpertsDirectoryClient({ experts }: { experts: ListedExpert[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data: { session: SessionData | null }) => {
        if (!cancelled) setSession(data.session);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const filteredExperts = useMemo(
    () =>
      selectedCategory === 'all'
        ? experts
        : experts.filter((e) => e.category === selectedCategory),
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

        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`touch-manipulation px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border rounded-md transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-white border-primary'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline'
              }`}
            >
              {cat}
            </button>
          ))}
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
                priority={index < 4}
              />
            ))}
          </div>
        )}

        {selectedExpert && isDesktop ? (
          <ExpertDetailPanel
            expert={selectedExpert}
            isSignedIn={Boolean(session)}
            onClose={handleClose}
          />
        ) : null}

        {selectedExpert && !isDesktop ? (
          <ExpertDetailSheet
            expert={selectedExpert}
            isSignedIn={Boolean(session)}
            onClose={handleClose}
          />
        ) : null}
      </main>
    </div>
  );
}
