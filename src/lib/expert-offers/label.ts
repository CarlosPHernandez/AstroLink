import type { ExpertOfferStatus } from '@/lib/expert-offers/types';
import { formatServiceTypeLabel } from '@/lib/types';

const OFFER_STATUS_LABEL: Record<ExpertOfferStatus, string> = {
  published: 'Published',
  draft: 'Draft',
  unpublished: 'Unpublished',
  archived: 'Archived',
};

export function formatOfferStatusLabel(status: ExpertOfferStatus): string {
  return OFFER_STATUS_LABEL[status];
}

export function formatOfferBookingLabel(opts: {
  serviceType: string;
  durationMinutes?: number | null;
  offerTitle?: string | null;
}): string {
  const title = opts.offerTitle?.trim();
  if (title) {
    if (opts.durationMinutes != null && Number.isFinite(opts.durationMinutes) && opts.durationMinutes > 0) {
      return `${title} (${Math.floor(opts.durationMinutes)} min)`;
    }
    return title;
  }
  return formatServiceTypeLabel(opts.serviceType, opts.durationMinutes);
}
