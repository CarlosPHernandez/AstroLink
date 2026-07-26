import type { ReactNode } from 'react';

/**
 * Shared page header for mentor dashboard tabs.
 * Type scale: 16px/500 title + 12px description (settings design language).
 */
export function MentorPageHeader({
  title,
  description,
  meta,
  as: HeadingTag = 'h1',
}: {
  title: string;
  description?: string;
  meta?: ReactNode;
  as?: 'h1' | 'h2';
}) {
  return (
    <header className="md-page-header">
      <div className="md-page-header-text">
        <HeadingTag className="md-page-title">{title}</HeadingTag>
        {description ? <p className="md-page-desc">{description}</p> : null}
      </div>
      {meta != null ? <div className="md-page-meta">{meta}</div> : null}
    </header>
  );
}
