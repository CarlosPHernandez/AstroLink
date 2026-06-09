'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ListedExpert } from '@/lib/mentor-directory';
import { toOptimizedImageUrl } from '@/lib/public-images';

export default function ExpertDirectory({ experts }: { experts: ListedExpert[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const filteredExperts =
    selectedCategory === 'all'
      ? experts
      : experts.filter((e) => e.category === selectedCategory);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const totalScrollable = scrollWidth - clientWidth;
      if (totalScrollable > 0) {
        setScrollProgress((scrollLeft / totalScrollable) * 100);
      } else {
        setScrollProgress(0);
      }
    }
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setScrollProgress(0);
    scrollContainerRef.current?.scrollTo({ left: 0 });
  };

  const scrollPrev = () => {
    scrollContainerRef.current?.scrollBy({ left: -384, behavior: 'smooth' });
  };

  const scrollNext = () => {
    scrollContainerRef.current?.scrollBy({ left: 384, behavior: 'smooth' });
  };

  return (
        <section id="directory" className="border-t border-outline-variant/30 bg-surface-container-low py-20 px-0 md:px-6 scroll-mt-20 overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-lg relative">
            
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-on-surface uppercase">Verified Directories</h2>
                <p className="text-on-surface-variant text-xs mt-1">Filter by primary discipline category to connect with certified advisors.</p>
              </div>
              
              {/* Category Filter Controls & Navigation */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap gap-2">
                  {['all', 'systems', 'propulsion', 'spacecraft', 'policy'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border rounded-md transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-primary text-white border-primary'
                          : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Carousel Arrow Navigation */}
                <div className="hidden sm:flex md:hidden items-center gap-2 border-l border-outline-variant/50 pl-4">
                  <button 
                    onClick={scrollPrev} 
                    className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary active:scale-90 transition-all cursor-pointer"
                    aria-label="Previous experts"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  </button>
                  <button 
                    onClick={scrollNext} 
                    className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary active:scale-90 transition-all cursor-pointer"
                    aria-label="Next experts"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Expert Cards Carousel / Grid */}
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex flex-row overflow-x-auto snap-x snap-mandatory scrollbar-none gap-6 pb-6 w-full -mx-6 px-6 scroll-smooth md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 md:overflow-x-visible md:pb-0 md:px-0 md:mx-0"
            >
              {filteredExperts.length === 0 ? (
                <p className="text-sm text-on-surface-variant font-light px-2 py-8">
                  No listed experts right now. Check Supabase seed data and that mentors are approved and listed.
                </p>
              ) : null}
              {filteredExperts.map((expert) => (
                <div 
                  key={expert.id}
                  data-testid={`expert-card-${expert.slug}`}
                  className="w-[84vw] xs:w-[320px] sm:w-[360px] md:w-full flex-shrink-0 md:flex-shrink snap-start p-6 border border-outline-variant bg-surface-container-lowest hover:border-outline hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col justify-between rounded-md group"
                >
                  <div>
                    <div className="flex gap-4 items-start mb-4">
                      {/* Avatar */}
                      <div className="relative w-14 h-14 flex-shrink-0 border border-outline-variant rounded-md overflow-hidden bg-surface-container-low shadow-inner">
                        <Image
                          src={toOptimizedImageUrl(expert.imageUrl)}
                          alt={expert.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="56px"
                        />
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <Link
                              href={`/experts/${expert.slug}`}
                              className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors hover:underline underline-offset-2"
                              data-testid={`expert-profile-link-${expert.slug}`}
                            >
                              {expert.name}
                            </Link>
                            <p className="text-[10px] text-on-surface-variant font-mono leading-none mb-1 uppercase mt-0.5">{expert.role}</p>
                            <p className="text-[10px] text-zinc-450 leading-none">{expert.employer}</p>
                          </div>
                        </div>
                        
                        {/* Active Indicator */}
                        <div className="mt-2.5 inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider">
                          {expert.availability === 'Available Now' ? (
                            <>
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                              <span className="text-emerald-600 font-semibold tracking-wide">
                                Active Now
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-1 h-1 rounded-full bg-zinc-300" />
                              <span className="text-zinc-400">
                                Book Session
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed mb-3 font-light line-clamp-2 min-h-[36px]">
                      {expert.bio}
                    </p>

                    {/* Expertise Bullet Points */}
                    <ul className="space-y-1.5 mb-6 mt-4">
                      {expert.expertise.slice(0, 3).map((exp, idx) => (
                        <li key={idx} className="flex items-center text-[11px] text-on-surface-variant font-light">
                          <span className="material-symbols-outlined text-[13px] text-primary/70 mr-2 flex-shrink-0" style={{ fontVariationSettings: "'wght' 600" }}>check_circle</span>
                          <span>{exp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-surface-container mt-auto">
                    <span className="text-[11px] font-mono text-on-surface font-semibold">
                      ${expert.rate}/hr
                    </span>
                    <Link
                      href={`/booking?mentor=${encodeURIComponent(expert.slug)}`}
                      data-testid={`expert-book-${expert.slug}`}
                      className={`px-3.5 py-2 border text-center text-[10px] font-bold uppercase tracking-wider transition-all duration-150 rounded-md ${
                        expert.availability === 'Available Now'
                          ? 'bg-primary text-white border-primary hover:bg-primary-container'
                          : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary bg-white shadow-sm'
                      }`}
                    >
                      {expert.availability === 'Available Now' ? 'Book session' : 'Schedule'}
                    </Link>
                  </div>
                </div>
              ))}
              {/* Spacer to prevent clipping on the right edge of scroll container on mobile */}
              <div className="w-1 flex-shrink-0 md:hidden" />
            </div>

            {/* Scroll Progress Bar & Swipe Indicator */}
            <div className="mt-8 flex md:hidden flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:max-w-[200px] h-[2px] bg-outline-variant/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-150"
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[12px] animate-pulse">swipe</span>
                Swipe or scroll to explore
              </span>
            </div>

          </div>
        </section>
  );
}
