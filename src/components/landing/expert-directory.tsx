'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ListedExpert } from '@/lib/mentor-directory';
import { MaterialIcon } from '@/components/ui/material-icon';
import { toOptimizedImageUrl } from '@/lib/public-images';

const TEASER_COUNT = 6;

export default function ExpertDirectory({ experts }: { experts: ListedExpert[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredExperts =
    selectedCategory === 'all'
      ? experts
      : experts.filter((e) => e.category === selectedCategory);

  const teaserExperts = filteredExperts.slice(0, TEASER_COUNT);

  return (
    <section
      id="directory"
      className="border-t border-outline-variant/30 bg-surface-container-low py-20 px-0 md:px-6 scroll-mt-20"
    >
      <div className="max-w-[1200px] mx-auto px-lg">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-on-surface uppercase">
              Verified Directories
            </h2>
            <p className="text-on-surface-variant text-xs mt-1">
              Featured experts — browse the full directory to watch intros and book sessions.
            </p>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter featured experts by category"
          >
            {['all', 'systems', 'propulsion', 'spacecraft', 'policy'].map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
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
        </header>

        {teaserExperts.length === 0 ? (
          <p className="text-sm text-on-surface-variant font-light px-2 py-8">
            No listed experts right now. Check Supabase seed data and that mentors are approved and
            listed.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {teaserExperts.map((expert, index) => (
              <Link
                key={expert.id}
                href={`/experts/${expert.slug}`}
                data-testid={`expert-card-${expert.slug}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest hover:border-outline hover:shadow-md transition-all duration-300"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-container-low">
                  <Image
                    src={toOptimizedImageUrl(expert.imageUrl)}
                    alt={expert.name}
                    fill
                    priority={index === 0}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 45vw, 220px"
                  />
                </div>
                <div className="p-4 border-t border-outline-variant/50">
                  <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                    {expert.name}
                  </p>
                  <p className="text-label-sm text-on-surface-variant truncate mt-0.5 tabular-nums">
                    ${expert.rate}/hr
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            href="/experts"
            data-testid="view-all-experts"
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface hover:border-primary hover:text-primary transition-colors"
          >
            View all experts
            <MaterialIcon name="arrow_forward" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
