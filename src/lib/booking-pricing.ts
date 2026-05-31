import type { ServiceType } from '@/lib/types';

/** D1: optional async pre-call brief add-on (USD cents) */
export const PRE_CALL_BRIEF_ADDON_CENTS = 7500;

export function computeBookingTotalCents(params: {
  serviceType: ServiceType;
  liveSessionPriceCents: number;
  includePreCallBrief: boolean;
}): number {
  if (params.serviceType === 'extended_session') {
    throw new Error('extended_session is not available in D1');
  }

  if (params.serviceType === 'pre_call_brief') {
    return PRE_CALL_BRIEF_ADDON_CENTS;
  }

  let total = params.liveSessionPriceCents;
  if (params.includePreCallBrief) {
    total += PRE_CALL_BRIEF_ADDON_CENTS;
  }
  return total;
}
