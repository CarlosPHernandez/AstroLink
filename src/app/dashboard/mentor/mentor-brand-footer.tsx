/** Product mark — rail + settings. Keep copy product-facing, not environment VERSION. */
export function MentorBrandFooter({
  testId = 'mentor-brand-footer',
}: {
  testId?: string;
}) {
  return (
    <footer className="md-brand" data-testid={testId}>
      <p className="md-brand-name">Astro-Link</p>
      <div className="md-brand-meta">
        <p className="md-brand-line">
          <span>Designed and Developed in the United States</span>
          <span className="md-brand-flag" role="img" aria-label="United States">
            <svg width="17" height="10" viewBox="0 0 17 10" fill="none" aria-hidden="true">
              <rect width="17" height="10" fill="#B22234" />
              <rect y="0.77" width="17" height="0.77" fill="#fff" />
              <rect y="2.31" width="17" height="0.77" fill="#fff" />
              <rect y="3.85" width="17" height="0.77" fill="#fff" />
              <rect y="5.38" width="17" height="0.77" fill="#fff" />
              <rect y="6.92" width="17" height="0.77" fill="#fff" />
              <rect y="8.46" width="17" height="0.77" fill="#fff" />
              <rect width="6.8" height="5.38" fill="#3C3B6E" />
            </svg>
          </span>
        </p>
        <p className="md-brand-version">Version 1.0 July 2026</p>
      </div>
    </footer>
  );
}
