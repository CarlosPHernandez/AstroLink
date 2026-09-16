'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MentorPageHeader } from '@/app/dashboard/mentor/mentor-page-header';
import { OFFER_DURATIONS, type OfferDurationMinutes } from '@/lib/expert-offers/constants';
import { dollarsToPriceCents } from '@/lib/expert-offers/money';
import type { ExpertOfferListItem, ExpertOfferStatus } from '@/lib/expert-offers/types';
import { formatMoney } from '@/lib/format';

const BETA_COPY =
  'Package one conversation you already run. Share the link. This is beta — it will not appear on the homepage.';

const STATUS_RANK: Record<ExpertOfferStatus, number> = {
  published: 0,
  draft: 1,
  unpublished: 2,
  archived: 3,
};

const STATUS_CHIP: Record<ExpertOfferStatus, string> = {
  published: 'md-chip md-chip-success',
  draft: 'md-chip md-chip-neutral',
  unpublished: 'md-chip md-chip-warn',
  archived: 'md-chip md-chip-danger',
};

type FormState = {
  title: string;
  description: string;
  durationMinutes: OfferDurationMinutes;
  priceDollars: string;
};

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  durationMinutes: 30,
  priceDollars: '',
};

function formFromOffer(offer: ExpertOfferListItem): FormState {
  return {
    title: offer.title,
    description: offer.description,
    durationMinutes: (OFFER_DURATIONS as readonly number[]).includes(offer.duration_minutes)
      ? (offer.duration_minutes as OfferDurationMinutes)
      : 30,
    priceDollars: (offer.price_cents / 100).toFixed(offer.price_cents % 100 === 0 ? 0 : 2),
  };
}

function publicHref(publicUrl: string): string {
  if (typeof window === 'undefined') return publicUrl;
  return `${window.location.origin}${publicUrl}`;
}

function priceDurationLocked(offer: ExpertOfferListItem): boolean {
  return offer.status !== 'draft' && offer.bookings_paid > 0;
}

function OfferActionAlert({
  message,
  kind,
}: {
  message: string;
  kind: 'publish' | 'other';
}) {
  return (
    <div className="md-alert md-alert-error" role="alert" data-testid="mentor-offer-error">
      <p className="md-alert-title">
        {kind === 'publish' ? "Can't publish this session" : 'Something went wrong'}
      </p>
      <p className="md-alert-body">{message}</p>
    </div>
  );
}

export function MentorOffersPanel() {
  const [items, setItems] = useState<ExpertOfferListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorKind, setErrorKind] = useState<'publish' | 'other'>('other');
  const [errorOfferId, setErrorOfferId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function clearError() {
    setError('');
    setErrorKind('other');
    setErrorOfferId(null);
  }

  function showError(message: string, kind: 'publish' | 'other' = 'other', offerId: string | null = null) {
    setError(message);
    setErrorKind(kind);
    setErrorOfferId(offerId);
  }

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    setErrorKind('other');
    setErrorOfferId(null);
    try {
      const res = await fetch('/api/mentor/offers');
      const data = (await res.json()) as { items?: ExpertOfferListItem[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Could not load sessions.');
        setErrorKind('other');
        setErrorOfferId(null);
        setItems([]);
      } else {
        setItems(data.items ?? []);
      }
    } catch {
      setError('Network error');
      setErrorKind('other');
      setErrorOfferId(null);
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const byStatus = (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99);
      if (byStatus !== 0) return byStatus;
      return a.title.localeCompare(b.title);
    });
  }, [items]);

  const editingOffer = editingId && editingId !== 'new' ? items.find((o) => o.id === editingId) ?? null : null;
  const lockPriceDuration = editingOffer ? priceDurationLocked(editingOffer) : false;

  function openCreate() {
    setEditingId('new');
    setForm(EMPTY_FORM);
    clearError();
  }

  function openEdit(offer: ExpertOfferListItem) {
    setEditingId(offer.id);
    setForm(formFromOffer(offer));
    clearError();
  }

  function closeForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function upsertItem(next: ExpertOfferListItem) {
    setItems((prev) => {
      const without = prev.filter((row) => row.id !== next.id);
      return [...without, next];
    });
  }

  async function handleSave() {
    const priceCents = dollarsToPriceCents(form.priceDollars);
    if (priceCents == null) {
      showError(
        'Price must be between $10 and $500.',
        'other',
        typeof editingId === 'string' && editingId !== 'new' ? editingId : null,
      );
      return;
    }

    const body: {
      title: string;
      description: string;
      duration_minutes?: number;
      price_cents?: number;
    } = {
      title: form.title.trim(),
      description: form.description.trim(),
    };
    if (!lockPriceDuration) {
      body.duration_minutes = form.durationMinutes;
      body.price_cents = priceCents;
    }

    setBusy(true);
    clearError();
    const saveOfferId = typeof editingId === 'string' && editingId !== 'new' ? editingId : null;
    try {
      const isCreate = editingId === 'new' || editingId == null;
      const res = await fetch(isCreate ? '/api/mentor/offers' : `/api/mentor/offers/${editingId}`, {
        method: isCreate ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isCreate
            ? {
                title: body.title,
                description: body.description,
                duration_minutes: form.durationMinutes,
                price_cents: priceCents,
              }
            : body,
        ),
      });
      const data = (await res.json()) as ExpertOfferListItem & { error?: string };
      if (!res.ok) {
        showError(data.error ?? 'Could not save session.', 'other', saveOfferId);
        setBusy(false);
        return;
      }
      upsertItem(data);
      setEditingId(data.id);
      setForm(formFromOffer(data));
    } catch {
      showError('Network error', 'other', saveOfferId);
    }
    setBusy(false);
  }

  async function postAction(offerId: string, action: 'publish' | 'unpublish' | 'archive') {
    setBusy(true);
    clearError();
    try {
      const res = await fetch(`/api/mentor/offers/${offerId}/${action}`, { method: 'POST' });
      const data = (await res.json()) as ExpertOfferListItem & { error?: string };
      if (!res.ok) {
        showError(
          data.error ?? `Could not ${action} session.`,
          action === 'publish' ? 'publish' : 'other',
          offerId,
        );
        setBusy(false);
        return;
      }
      upsertItem(data);
      if (editingId === offerId) {
        setForm(formFromOffer(data));
      }
    } catch {
      showError('Network error', action === 'publish' ? 'publish' : 'other', offerId);
    }
    setBusy(false);
  }

  async function copyPublicUrl(offer: ExpertOfferListItem) {
    const href = publicHref(offer.public_url);
    try {
      await navigator.clipboard.writeText(href);
      setCopiedId(offer.id);
      window.setTimeout(() => setCopiedId((current) => (current === offer.id ? null : current)), 1500);
    } catch {
      showError('Could not copy link.', 'other', offer.id);
    }
  }

  return (
    <div className="md-stack" data-testid="mentor-offers-tab">
      <MentorPageHeader
        as="h2"
        title="Services"
        description={BETA_COPY}
        meta={
          !loading && items.length > 0 && editingId == null ? (
            <button type="button" className="md-btn md-btn-primary" onClick={openCreate}>
              Create session
            </button>
          ) : null
        }
      />

      {error && editingId == null && errorOfferId == null ? (
        <OfferActionAlert message={error} kind={errorKind} />
      ) : null}

      {loading ? (
        <p className="md-empty">Loading…</p>
      ) : editingId != null ? (
        <form
          className="md-card md-field-stack md-form-col"
          data-testid="mentor-offer-form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
        >
          <div>
            <label htmlFor="mentor-offer-title" className="md-label">
              Title
            </label>
            <input
              id="mentor-offer-title"
              className="md-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              minLength={8}
              maxLength={80}
              disabled={busy || editingOffer?.status === 'archived'}
            />
          </div>
          <div>
            <label htmlFor="mentor-offer-description" className="md-label">
              Description
            </label>
            <textarea
              id="mentor-offer-description"
              className="md-input"
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              minLength={40}
              maxLength={1200}
              disabled={busy || editingOffer?.status === 'archived'}
            />
          </div>
          <div className="md-field-grid md-field-grid-2">
            <div>
              <label htmlFor="mentor-offer-duration" className="md-label">
                Duration
              </label>
              <select
                id="mentor-offer-duration"
                className="md-input"
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    durationMinutes: Number(e.target.value) as OfferDurationMinutes,
                  })
                }
                disabled={busy || lockPriceDuration || editingOffer?.status === 'archived'}
              >
                {OFFER_DURATIONS.map((mins) => (
                  <option key={mins} value={mins}>
                    {mins} min
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mentor-offer-price" className="md-label">
                Price (USD)
              </label>
              <input
                id="mentor-offer-price"
                className="md-input"
                type="number"
                min={10}
                max={500}
                step="0.01"
                value={form.priceDollars}
                onChange={(e) => setForm({ ...form, priceDollars: e.target.value })}
                required
                disabled={busy || lockPriceDuration || editingOffer?.status === 'archived'}
              />
            </div>
          </div>
          {lockPriceDuration ? (
            <p className="md-empty">Create a new session to change price or duration.</p>
          ) : null}

          {editingOffer ? (
            <p className="md-card-meta">
              Public link: {publicHref(editingOffer.public_url)}
            </p>
          ) : null}

          {error ? <OfferActionAlert message={error} kind={errorKind} /> : null}

          <div className="md-btn-row">
            {editingOffer?.status !== 'archived' ? (
              <button type="submit" className="md-btn md-btn-primary" disabled={busy}>
                {busy ? 'Saving…' : editingId === 'new' ? 'Create session' : 'Save'}
              </button>
            ) : null}
            {editingOffer && editingOffer.status !== 'published' && editingOffer.status !== 'archived' ? (
              <button
                type="button"
                className="md-btn md-btn-primary"
                disabled={busy}
                onClick={() => void postAction(editingOffer.id, 'publish')}
              >
                Publish {editingOffer.public_url}
              </button>
            ) : null}
            {editingOffer?.status === 'published' ? (
              <button
                type="button"
                className="md-btn md-btn-ghost"
                disabled={busy}
                onClick={() => void postAction(editingOffer.id, 'unpublish')}
              >
                Unpublish
              </button>
            ) : null}
            {editingOffer && editingOffer.status !== 'archived' ? (
              <button
                type="button"
                className="md-btn md-btn-ghost"
                disabled={busy}
                onClick={() => void postAction(editingOffer.id, 'archive')}
              >
                Archive
              </button>
            ) : null}
            <button type="button" className="md-btn md-btn-ghost" disabled={busy} onClick={closeForm}>
              Back
            </button>
          </div>
        </form>
      ) : items.length === 0 ? (
        <div className="md-stack-tight" data-testid="mentor-offers-empty">
          <p className="md-empty">{BETA_COPY}</p>
          <button type="button" className="md-btn md-btn-primary" onClick={openCreate}>
            Create session
          </button>
        </div>
      ) : (
        <div className="md-stack-tight">
          {sorted.map((offer) => (
            <article
              key={offer.id}
              className="md-card"
              data-testid={`mentor-offer-row-${offer.id}`}
            >
              <div className="md-card-head">
                <p className="md-card-title">{offer.title}</p>
                <span className={STATUS_CHIP[offer.status]}>{offer.status}</span>
              </div>
              <p className="md-card-meta">
                {formatMoney(offer.price_cents)} · {offer.duration_minutes} min · {offer.page_views}{' '}
                views · {offer.bookings_paid} paid
              </p>
              <p className="md-card-meta">
                {publicHref(offer.public_url)}{' '}
                <button
                  type="button"
                  className="md-link"
                  data-testid="mentor-offer-copy-url"
                  onClick={() => void copyPublicUrl(offer)}
                >
                  {copiedId === offer.id ? 'Copied' : 'Copy link'}
                </button>
              </p>
              {error && errorOfferId === offer.id && editingId == null ? (
                <OfferActionAlert message={error} kind={errorKind} />
              ) : null}
              <div className="md-btn-row">
                <button
                  type="button"
                  className="md-btn md-btn-ghost"
                  onClick={() => openEdit(offer)}
                >
                  {offer.status === 'archived' ? 'View' : 'Edit'}
                </button>
                {offer.status !== 'published' && offer.status !== 'archived' ? (
                  <button
                    type="button"
                    className="md-btn md-btn-primary"
                    disabled={busy}
                    onClick={() => void postAction(offer.id, 'publish')}
                  >
                    Publish {offer.public_url}
                  </button>
                ) : null}
                {offer.status === 'published' ? (
                  <button
                    type="button"
                    className="md-btn md-btn-ghost"
                    disabled={busy}
                    onClick={() => void postAction(offer.id, 'unpublish')}
                  >
                    Unpublish
                  </button>
                ) : null}
                {offer.status !== 'archived' ? (
                  <button
                    type="button"
                    className="md-btn md-btn-ghost"
                    disabled={busy}
                    onClick={() => void postAction(offer.id, 'archive')}
                  >
                    Archive
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
