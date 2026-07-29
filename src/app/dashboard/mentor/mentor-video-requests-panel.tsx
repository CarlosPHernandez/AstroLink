'use client';

import { useCallback, useEffect, useState } from 'react';
import { MentorPageHeader } from '@/app/dashboard/mentor/mentor-page-header';
import { formatMoney } from '@/lib/format';
import {
  VIDEO_REQUEST_OCCASION_LABELS,
  type VideoRequestOccasion,
} from '@/lib/video-requests/types';

type ListItem = {
  id: string;
  status: string;
  occasion: string;
  fromName: string;
  recipientName: string | null;
  buyerEmail: string;
  priceCents: number;
  paidAt: string | null;
  dueAt: string | null;
  deliveredAt: string | null;
  instructionsPreview: string;
  isOverdue: boolean;
};

type Detail = ListItem & {
  instructions: string;
  pronunciationNotes: string | null;
  declineReason: string | null;
};

function occasionLabel(o: string): string {
  if (o in VIDEO_REQUEST_OCCASION_LABELS) {
    return VIDEO_REQUEST_OCCASION_LABELS[o as VideoRequestOccasion];
  }
  return o;
}

export function MentorVideoRequestsPanel() {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/mentor/video-requests?status=open');
      const data = (await res.json()) as { items?: ListItem[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Could not load');
        setItems([]);
      } else {
        setItems(data.items ?? []);
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function openDetail(id: string) {
    setSelectedId(id);
    setDetail(null);
    setDeclineReason('');
    const res = await fetch(`/api/mentor/video-requests/${id}`);
    const data = (await res.json()) as Detail & { error?: string };
    if (!res.ok) {
      setError(data.error ?? 'Could not load detail');
      return;
    }
    setDetail(data);
  }

  async function handleUploadAndDeliver(file: File) {
    if (!selectedId || !detail) return;
    setBusy(true);
    setError('');
    try {
      const contentType =
        file.type === 'video/webm'
          ? 'video/webm'
          : file.type === 'video/quicktime'
            ? 'video/quicktime'
            : 'video/mp4';
      const urlRes = await fetch(`/api/mentor/video-requests/${selectedId}/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType }),
      });
      const urlData = (await urlRes.json()) as {
        path?: string;
        signedUrl?: string;
        token?: string;
        error?: string;
      };
      if (!urlRes.ok || !urlData.signedUrl || !urlData.path) {
        setError(urlData.error ?? 'Upload URL failed');
        setBusy(false);
        return;
      }

      const put = await fetch(urlData.signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          ...(urlData.token ? { 'x-upsert': 'true' } : {}),
        },
        body: file,
      });
      if (!put.ok) {
        // Supabase signed upload may need token query — try createSignedUploadUrl protocol
        const put2 = await fetch(urlData.signedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': contentType },
        });
        if (!put2.ok) {
          setError('Upload failed. Check storage bucket policies.');
          setBusy(false);
          return;
        }
      }

      const delRes = await fetch(`/api/mentor/video-requests/${selectedId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: urlData.path }),
      });
      const delData = (await delRes.json()) as { error?: string };
      if (!delRes.ok) {
        setError(delData.error ?? 'Deliver failed');
        setBusy(false);
        return;
      }
      setSelectedId(null);
      setDetail(null);
      await loadList();
    } catch {
      setError('Upload failed');
    }
    setBusy(false);
  }

  async function handleDecline() {
    if (!selectedId || declineReason.trim().length < 3) {
      setError('Add a short reason to decline');
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/mentor/video-requests/${selectedId}/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: declineReason }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? 'Decline failed');
      return;
    }
    setSelectedId(null);
    setDetail(null);
    await loadList();
  }

  return (
    <div data-testid="mentor-video-requests-tab">
      <MentorPageHeader
        title="Video requests"
        description="Personal video messages buyers ordered — fulfill before the due date."
      />

      {error ? (
        <p className="md-alert md-alert-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="md-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="md-muted" data-testid="mentor-video-empty">
          No open video requests. When someone orders a personal video, it will show up here.
        </p>
      ) : (
        <div className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>
                <th>From</th>
                <th>Occasion</th>
                <th>Due</th>
                <th>Price</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.fromName}
                    {item.isOverdue ? (
                      <span className="md-chip md-chip-warn" style={{ marginLeft: 8 }}>
                        Overdue
                      </span>
                    ) : null}
                  </td>
                  <td>{occasionLabel(item.occasion)}</td>
                  <td>
                    {item.dueAt
                      ? new Date(item.dueAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td>{formatMoney(item.priceCents)}</td>
                  <td>
                    <button
                      type="button"
                      className="md-btn md-btn-secondary"
                      onClick={() => void openDetail(item.id)}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail ? (
        <div
          className="md-card"
          style={{ marginTop: 24, padding: 20 }}
          data-testid="mentor-video-detail"
        >
          <h3 style={{ marginTop: 0 }}>
            {detail.fromName}
            {detail.recipientName ? ` → ${detail.recipientName}` : ''}
          </h3>
          <p className="md-muted">
            {occasionLabel(detail.occasion)} · {detail.buyerEmail}
          </p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{detail.instructions}</p>
          {detail.pronunciationNotes ? (
            <p className="md-muted">Pronunciation: {detail.pronunciationNotes}</p>
          ) : null}

          <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <label className="md-btn md-btn-primary" style={{ cursor: busy ? 'wait' : 'pointer' }}>
              {busy ? 'Working…' : 'Upload & deliver'}
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                hidden
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUploadAndDeliver(f);
                }}
              />
            </label>
            <div style={{ flex: 1, minWidth: 200 }}>
              <input
                type="text"
                placeholder="Decline reason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="md-input"
              />
              <button
                type="button"
                className="md-btn md-btn-secondary"
                style={{ marginTop: 8 }}
                disabled={busy}
                onClick={() => void handleDecline()}
              >
                Decline & refund
              </button>
            </div>
            <button
              type="button"
              className="md-btn md-btn-ghost"
              onClick={() => {
                setSelectedId(null);
                setDetail(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
