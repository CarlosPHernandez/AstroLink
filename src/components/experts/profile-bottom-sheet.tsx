'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function ProfileBottomSheet({
  title,
  onClose,
  children,
  testId,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  testId?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div className="experts-pro-sheet" data-testid={testId}>
      <button
        type="button"
        className="experts-pro-sheet__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="experts-pro-sheet__panel"
      >
        <div className="experts-pro-sheet__handle" aria-hidden />
        <div className="experts-pro-sheet__head">
          <h2>{title}</h2>
          <button type="button" className="experts-pro-sheet__close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="experts-pro-sheet__body">{children}</div>
      </div>
    </div>
  );
}
