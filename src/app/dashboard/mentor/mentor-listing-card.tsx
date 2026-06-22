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

function listedLabel(isListed: boolean): string {
  return isListed ? 'Yes' : 'No';
}

export function MentorListingCard({ complianceStatus, isListed, slug }: MentorListingCardProps) {
  const trimmedSlug = slug?.trim() ?? '';
  const publicPath = trimmedSlug ? expertProfilePath(trimmedSlug) : null;
  const showPreview = canPreviewExpertListing(isListed, slug);
  const statusCopy = listingVisibilityCopy(complianceStatus, isListed);

  return (
    <section
      className="rounded-lg border border-outline-variant bg-surface p-6"
      data-testid="mentor-listing-card"
    >
      <header className="mb-4">
        <h3 className="text-sm font-semibold text-on-surface">Public listing</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{statusCopy}</p>
      </header>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-on-surface-variant">Compliance status</dt>
          <dd className="mt-1 text-sm text-on-surface" data-testid="mentor-listing-compliance">
            {complianceStatusLabel(complianceStatus)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-on-surface-variant">Listed on directory</dt>
          <dd className="mt-1 text-sm text-on-surface" data-testid="mentor-listing-listed">
            {listedLabel(isListed)}
          </dd>
        </div>
        {publicPath ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-on-surface-variant">Public URL</dt>
            <dd className="mt-1 text-sm text-on-surface">
              <code className="rounded bg-surface-container-low px-1.5 py-0.5 text-xs">
                {publicPath}
              </code>
            </dd>
          </div>
        ) : null}
      </dl>

      {showPreview && publicPath ? (
        <p className="mt-4">
          <a
            href={publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:text-primary-container"
            data-testid="mentor-listing-preview"
          >
            Preview public profile
          </a>
        </p>
      ) : null}
    </section>
  );
}