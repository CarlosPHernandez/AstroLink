'use client';

import { useEffect, useRef } from 'react';
import type { ListedExpert } from '@/lib/mentor-directory';
import { ExpertDetailContent } from './expert-detail-content';

type ExpertDetailSheetProps = {
  expert: ListedExpert;
  isSignedIn: boolean;
  onClose: () => void;
};

export function ExpertDetailSheet({ expert, isSignedIn, onClose }: ExpertDetailSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    sheetRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] lg:hidden" data-testid="expert-detail-sheet">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close expert preview"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview for ${expert.name}`}
        className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-2xl border border-outline-variant bg-background px-5 pt-4 pb-0 shadow-2xl"
        style={{ animation: 'revealUp 0.3s ease-out forwards' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-outline-variant" aria-hidden />
        <ExpertDetailContent
          expert={expert}
          isSignedIn={isSignedIn}
          layout="sheet"
          onClose={onClose}
        />
      </div>
    </div>
  );
}
