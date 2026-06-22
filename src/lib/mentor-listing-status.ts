export type ComplianceStatus =
  | 'pending_review'
  | 'document_required'
  | 'stripe_incomplete'
  | 'awaiting_human_approval'
  | 'approved'
  | 'rejected';

export function complianceStatusLabel(status: string): string {
  switch (status) {
    case 'pending_review':
      return 'Pending review';
    case 'document_required':
      return 'Document required';
    case 'stripe_incomplete':
      return 'Stripe incomplete';
    case 'awaiting_human_approval':
      return 'Awaiting human approval';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return status.replace(/_/g, ' ');
  }
}

export function listingVisibilityCopy(complianceStatus: string, isListed: boolean): string {
  if (complianceStatus === 'approved' && isListed) {
    return 'Live on the expert directory';
  }
  if (complianceStatus === 'approved' && !isListed) {
    return 'Approved but not listed — contact ops';
  }
  if (complianceStatus === 'pending_review' || complianceStatus === 'awaiting_human_approval') {
    return 'Under review';
  }
  if (complianceStatus === 'document_required') {
    return 'NF-1860 or compliance docs needed';
  }
  if (complianceStatus === 'rejected') {
    return 'Not approved for listing';
  }
  if (complianceStatus === 'stripe_incomplete') {
    return 'Complete payout setup to proceed';
  }
  return 'Listing status unavailable';
}

export function canPreviewExpertListing(isListed: boolean, slug: string | null): boolean {
  return isListed && Boolean(slug?.trim());
}

export function expertProfilePath(slug: string): string {
  return `/experts/${slug}`;
}