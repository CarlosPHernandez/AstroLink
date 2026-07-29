'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { VIDEO_REQUEST_OCCASION_LABELS, type VideoRequestOccasion } from '@/lib/video-requests/types';

type ViewPayload = {
  status: string;
  occasion: string;
  fromName: string;
  recipientName: string | null;
  dueAt: string | null;
  deliveredAt: string | null;
  expertName: string;
  expertSlug: string | null;
  expertImageUrl: string | null;
  mediaUrl: string | null;
  error?: string;
};

export default function VideoWatchClient() {
  const [data, setData] = useState<ViewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('t');
    if (!token) {
      setError('Link unavailable');
      setLoading(false);
      return;
    }
    fetch(`/api/video-requests/view?t=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = (await res.json()) as ViewPayload;
        if (!res.ok) {
          setError(json.error ?? 'Link unavailable');
          return;
        }
        setData(json);
      })
      .catch(() => setError('Could not load video'))
      .finally(() => setLoading(false));
  }, []);

  const firstName = data?.expertName?.split(' ')[0] ?? 'your expert';
  const occasionLabel =
    data && data.occasion in VIDEO_REQUEST_OCCASION_LABELS
      ? VIDEO_REQUEST_OCCASION_LABELS[data.occasion as VideoRequestOccasion]
      : data?.occasion;

  return (
    <div className="experts-profile min-h-screen">
      <header className="experts-pro-header">
        <div className="experts-pro-header__inner">
          <Link href="/" className="experts-pro-logo">
            AstroLink
          </Link>
        </div>
      </header>

      <main className="experts-pro-main" style={{ maxWidth: 640 }}>
        {loading ? (
          <p className="experts-pro-muted" style={{ color: 'var(--pro-muted)' }}>
            Loading…
          </p>
        ) : error ? (
          <div data-testid="video-watch-error">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Link unavailable</h1>
            <p className="experts-pro-book-note">{error}</p>
            <p className="experts-pro-book-note">
              If you need help, reply to your confirmation email.
            </p>
          </div>
        ) : data?.status === 'delivered' && data.mediaUrl ? (
          <div data-testid="video-watch-ready">
            <p className="experts-pro-eyebrow">Personal video</p>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              From {data.expertName}
            </h1>
            {occasionLabel ? (
              <p className="experts-pro-book-note" style={{ marginBottom: '1rem' }}>
                {occasionLabel}
              </p>
            ) : null}
            <div
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#000',
              }}
            >
              <video
                controls
                playsInline
                src={data.mediaUrl}
                style={{ width: '100%', display: 'block', maxHeight: '70vh' }}
              />
            </div>
            <p className="experts-pro-book-note" style={{ marginTop: '1rem' }}>
              Personal opinion — not institutional or official advice.
            </p>
            {data.expertSlug ? (
              <p className="experts-pro-book-note" style={{ marginTop: '1.25rem' }}>
                <Link href={`/experts/${data.expertSlug}`} className="experts-pro-text-link">
                  Book time with {firstName}
                </Link>
              </p>
            ) : null}
          </div>
        ) : data ? (
          <div data-testid="video-watch-pending">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Still in progress</h1>
            <p className="experts-pro-lede">
              {firstName} is working on your video
              {data.dueAt
                ? ` · usually ready by ${new Date(data.dueAt).toLocaleDateString()}`
                : ''}
              .
            </p>
            <p className="experts-pro-book-note">We&apos;ll email you when it&apos;s ready.</p>
          </div>
        ) : null}

        <p style={{ marginTop: '2rem' }}>
          <Link href="/" className="experts-pro-dir-link">
            <MaterialIcon name="arrow_back" size={18} />
            AstroLink
          </Link>
        </p>
      </main>
    </div>
  );
}
