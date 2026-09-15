import { formatServiceTypeLabel } from '@/lib/types';

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
