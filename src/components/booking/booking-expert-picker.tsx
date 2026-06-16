'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BookingExpertPickerCard } from '@/components/booking/booking-expert-picker-card';
import { ExpertCategoryFilter } from '@/components/booking/expert-category-filter';
import { filterExpertsByCategory } from '@/lib/expert-categories';
import type { ListedExpert } from '@/lib/mentor-directory';

type BookingExpertPickerProps = {
  experts: ListedExpert[];
  selectedSlug: string | null;
  invalidMentorSlug?: string | null;
  onSelect: (slug: string) => void;
};

export function BookingExpertPicker({
  experts,
  selectedSlug,
  invalidMentorSlug,
  onSelect,
}: BookingExpertPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredExperts = useMemo(
    () => filterExpertsByCategory(experts, selectedCategory),
    [experts, selectedCategory],
  );

  return (
    <section aria-labelledby="booking-expert-picker-heading" data-testid="booking-expert-picker">
      <h2 id="booking-expert-picker-heading" className="text-label-md font-semibold text-on-surface mb-1">
        Choose your expert
      </h2>
      <p className="text-label-sm text-on-surface-variant mb-4">
        Select who you want to meet — your rate updates instantly in the summary.
      </p>

      {invalidMentorSlug ? (
        <p className="text-label-sm text-error mb-3" role="alert">
          We couldn&apos;t find an expert matching &ldquo;{invalidMentorSlug}&rdquo;. Pick someone
          below.
        </p>
      ) : null}

      <ExpertCategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={(cat) => setSelectedCategory(cat)}
      />

      {filteredExperts.length === 0 ? (
        <p className="text-label-sm text-on-surface-variant py-6">
          No listed experts in this category right now.{' '}
          <Link href="/experts" className="text-primary hover:underline">
            View full directory
          </Link>
        </p>
      ) : (
        <div className="relative mt-4">
          <p className="sr-only">Swipe horizontally to browse more experts.</p>
          <p
            className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-2 lg:hidden"
            aria-hidden="true"
          >
            Swipe to browse →
          </p>
          <div
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-pl-4 pb-2 -mx-4 px-4 sm:-mx-1 sm:px-1 touch-pan-x overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            role="list"
            aria-label="Available experts"
          >
            {filteredExperts.map((expert, index) => (
              <BookingExpertPickerCard
                key={expert.id}
                expert={expert}
                isSelected={selectedSlug === expert.slug}
                onSelect={() => onSelect(expert.slug)}
                priority={index === 0}
              />
            ))}
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent sm:hidden"
            aria-hidden="true"
          />
        </div>
      )}

      <p className="mt-3 text-label-sm text-on-surface-variant">
        Want intro videos and full bios?{' '}
        <Link href="/experts" className="text-primary hover:underline">
          View full directory →
        </Link>
      </p>
    </section>
  );
}