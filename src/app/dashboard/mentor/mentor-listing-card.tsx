'use client';

import {
  canPreviewExpertListing,
  complianceStatusLabel,
  expertProfilePath,
  listingVisibilityCopy,
} from '@/lib/mentor-listing-status';

interface MentorListingCardProps {
  complianceStatus: string;
  isListed: boolean;
  slug: string | null;
}

export function MentorListingCard({
  complianceStatus,
  isListed,
  slug,
}: MentorListingCardProps) {
  const trimmedSlug = slug?.trim() ?? '';
  const publicPath = trimmedSlug ? expertProfilePath(trimmedSlug) : null;
  const showPreview = canPreviewExpertListing(isListed, slug);
  const statusCopy = listingVisibilityCopy(complianceStatus, isListed);

  return (
    <p className="md-listing-line" data-testid="mentor-listing-card">
      <span data-testid="mentor-listing-compliance">
        {complianceStatusLabel(complianceStatus)}
      </span>
      {' · '}
      <span data-testid="mentor-listing-listed">
        {isListed ? 'Listed on directory' : 'Not listed'}
      </span>
      {' · '}
      {statusCopy}
      {showPreview && publicPath ? (
        <>
          {' · '}
          <a
            href={publicPath}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="mentor-listing-preview"
          >
            Preview public profile
          </a>
        </>
      ) : null}
    </p>
  );
}
