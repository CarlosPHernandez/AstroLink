'use client';

import { useEffect } from 'react';

export function OfferPublicClient({
  mentorSlug,
  offerSlug,
}: {
  mentorSlug: string;
  offerSlug: string;
}) {
  useEffect(() => {
    void fetch(
      `/api/offers/public/${encodeURIComponent(mentorSlug)}/${encodeURIComponent(offerSlug)}/view`,
      { method: 'POST', keepalive: true },
    );
  }, [mentorSlug, offerSlug]);

  return null;
}
