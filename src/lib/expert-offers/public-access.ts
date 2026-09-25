import type { ExpertOfferStatus } from '@/lib/expert-offers/types';

export type PublicOfferAccess = {
  status: ExpertOfferStatus;
  expert_offers_enabled: boolean;
  compliance_status: string;
  is_listed: boolean;
};

export function isOfferPubliclyBookable(args: PublicOfferAccess): boolean {
  return (
    args.status === 'published' &&
    args.expert_offers_enabled &&
    args.compliance_status === 'approved' &&
    args.is_listed
  );
}
