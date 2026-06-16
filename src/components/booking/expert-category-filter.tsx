'use client';

import { EXPERT_CATEGORIES } from '@/lib/expert-categories';

type ExpertCategoryFilterProps = {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
};

export function ExpertCategoryFilter({
  selectedCategory,
  onCategoryChange,
}: ExpertCategoryFilterProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filter experts by category"
    >
      {EXPERT_CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onCategoryChange(cat)}
          aria-pressed={selectedCategory === cat}
          className={`touch-manipulation min-h-11 px-3.5 py-2 text-[10px] font-mono uppercase tracking-wider border rounded-md transition-all cursor-pointer ${
            selectedCategory === cat
              ? 'bg-primary text-white border-primary'
              : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}