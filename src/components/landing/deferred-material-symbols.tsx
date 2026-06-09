'use client';

import { useEffect } from 'react';

const HREF =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';

/** Load icon font after first paint so it does not block LCP. */
export function DeferredMaterialSymbols() {
  useEffect(() => {
    if (document.querySelector(`link[href="${HREF}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = HREF;
    document.head.appendChild(link);
  }, []);

  return null;
}
