'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ListedExpert } from '@/lib/mentor-directory';
import { ExpertDetailContent } from './expert-detail-content';

type ExpertDetailPanelProps = {
  expert: ListedExpert;
  isSignedIn: boolean;
  waitlistMode: boolean;
  onClose: () => void;
};

export function ExpertDetailPanel({
  expert,
  isSignedIn,
  waitlistMode,
  onClose,
}: ExpertDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    panelRef.current?.focus({ preventScroll: true });
  }, [expert.slug]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]" data-testid="expert-detail-panel">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close expert preview"
        onClick={onClose}
      />
      <div className="relative flex min-h-full items-center justify-center p-6 sm:p-10 pointer-events-none">
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={`Preview for ${expert.name}`}
          className="pointer-events-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 sm:p-8 shadow-2xl max-h-[min(92vh,880px)]"
          style={{ animation: 'revealUp 0.3s ease-out forwards' }}
        >
          <ExpertDetailContent
            expert={expert}
            isSignedIn={isSignedIn}
            waitlistMode={waitlistMode}
            layout="panel"
            onClose={onClose}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
