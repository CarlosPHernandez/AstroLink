'use client';

import React, { useCallback, useEffect, useState } from 'react';

type MentorSummary = {
  id: string;
  email: string;
  fullName: string;
  slug: string | null;
  liveSessionPriceCents: number;
  isListed: boolean;
  complianceStatus: string;
  bookHref: string | null;
};

const fieldClass =
  'w-full py-2.5 px-3 bg-surface-container-lowest border border-outline-variant rounded-md text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary';

const RISK_DEFAULTS = {
  email: '',
  fullName: 'Risk',
  slug: 'risk',
  title: 'Ops dry-run expert',
  employer: 'AstroLink',
  expertise: 'Session Ops, Systems Engineering',
  bio: 'Temporary free mentor for dual-device rehearsal. Unlist after the test.',
  rateDollars: '0',
  isListed: true,
};

export function CreateExpertPanel() {
  const [email, setEmail] = useState(RISK_DEFAULTS.email);
  const [fullName, setFullName] = useState(RISK_DEFAULTS.fullName);
  const [slug, setSlug] = useState(RISK_DEFAULTS.slug);
  const [title, setTitle] = useState(RISK_DEFAULTS.title);
  const [employer, setEmployer] = useState(RISK_DEFAULTS.employer);
  const [expertise, setExpertise] = useState(RISK_DEFAULTS.expertise);
  const [bio, setBio] = useState(RISK_DEFAULTS.bio);
  const [rateDollars, setRateDollars] = useState(RISK_DEFAULTS.rateDollars);
  const [isListed, setIsListed] = useState(RISK_DEFAULTS.isListed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bookHref, setBookHref] = useState<string | null>(null);
  const [mentors, setMentors] = useState<MentorSummary[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  const loadMentors = useCallback(async () => {
    setListError(null);
    try {
      const res = await fetch('/api/admin/mentors');
      const json = (await res.json()) as {
        success?: boolean;
        mentors?: MentorSummary[];
        error?: string;
      };
      if (!res.ok || !json.success || !json.mentors) {
        throw new Error(json.error ?? 'Failed to load mentors');
      }
      setMentors(json.mentors);
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : 'Failed to load mentors');
    }
  }, []);

  useEffect(() => {
    void loadMentors();
  }, [loadMentors]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setBookHref(null);

    const dollars = Number.parseFloat(rateDollars);
    const liveSessionPriceCents = Number.isFinite(dollars)
      ? Math.max(0, Math.round(dollars * 100))
      : 0;

    try {
      const res = await fetch('/api/admin/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim(),
          slug: slug.trim().toLowerCase(),
          title: title.trim(),
          employer: employer.trim(),
          expertise: expertise
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          bio: bio.trim(),
          liveSessionPriceCents,
          isListed,
          complianceStatus: 'approved',
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        mentor?: {
          created: boolean;
          bookHref: string;
          fullName: string;
          slug: string;
          liveSessionPriceCents: number;
        };
      };
      if (!res.ok || !json.success || !json.mentor) {
        throw new Error(json.error ?? 'Could not save expert');
      }

      const rateLabel =
        json.mentor.liveSessionPriceCents === 0
          ? 'Free ($0)'
          : `$${(json.mentor.liveSessionPriceCents / 100).toFixed(0)}/hr`;
      setSuccess(
        json.mentor.created
          ? `Created ${json.mentor.fullName} (${rateLabel}).`
          : `Updated ${json.mentor.fullName} (${rateLabel}).`,
      );
      setBookHref(json.mentor.bookHref);
      await loadMentors();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save expert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="p-6 rounded-md border border-outline-variant bg-surface-container-lowest shadow-sm"
      data-testid="admin-create-expert"
    >
      <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2 mb-1">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
        Create / update expert
      </h2>
      <p className="text-on-surface-variant text-xs mb-4">
        Ops-only. Use Carlos&apos;s login email so he joins as mentor. Set rate to $0 for free
        dry-runs. Buyer books via the link below (not /experts under waitlist).
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="expert-email" className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
              Mentor login email
            </label>
            <input
              id="expert-email"
              data-testid="admin-expert-email"
              type="email"
              required
              placeholder="carlos@…"
              className={fieldClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="expert-slug" className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
              Slug
            </label>
            <input
              id="expert-slug"
              data-testid="admin-expert-slug"
              required
              className={fieldClass}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="expert-name" className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
              Display name
            </label>
            <input
              id="expert-name"
              data-testid="admin-expert-name"
              required
              className={fieldClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="expert-rate" className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
              Hourly rate (USD)
            </label>
            <input
              id="expert-rate"
              data-testid="admin-expert-rate"
              type="number"
              min={0}
              step={1}
              className={fieldClass}
              value={rateDollars}
              onChange={(e) => setRateDollars(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="expert-title" className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
              Title
            </label>
            <input
              id="expert-title"
              className={fieldClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="expert-employer" className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
              Employer
            </label>
            <input
              id="expert-employer"
              className={fieldClass}
              value={employer}
              onChange={(e) => setEmployer(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="expert-expertise" className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
            Expertise (comma-separated)
          </label>
          <input
            id="expert-expertise"
            className={fieldClass}
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="expert-bio" className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
            Bio
          </label>
          <textarea
            id="expert-bio"
            rows={3}
            className={`${fieldClass} resize-none`}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer">
          <input
            type="checkbox"
            checked={isListed}
            onChange={(e) => setIsListed(e.target.checked)}
            data-testid="admin-expert-listed"
          />
          Listed (approved + bookable)
        </label>

        <button
          type="submit"
          disabled={loading}
          data-testid="admin-expert-submit"
          className="px-4 py-2.5 rounded-md bg-primary text-white text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save expert'}
        </button>
      </form>

      {error ? (
        <p className="mt-3 text-sm text-error" role="alert" data-testid="admin-expert-error">
          {error}
        </p>
      ) : null}
      {success ? (
        <div className="mt-3 space-y-2" data-testid="admin-expert-success">
          <p className="text-sm text-primary font-medium">{success}</p>
          {bookHref ? (
            <p className="text-xs text-on-surface-variant break-all">
              Rosana books at:{' '}
              <a className="text-primary underline font-mono" href={bookHref}>
                {typeof window !== 'undefined' ? `${window.location.origin}${bookHref}` : bookHref}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 border-t border-outline-variant pt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
            Recent mentors
          </h3>
          <button
            type="button"
            onClick={() => void loadMentors()}
            className="text-[10px] text-on-surface-variant hover:text-on-surface"
          >
            Refresh
          </button>
        </div>
        {listError ? <p className="text-xs text-error">{listError}</p> : null}
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {mentors.map((m) => (
            <li
              key={m.id}
              className="text-xs font-mono text-on-surface-variant flex flex-wrap gap-x-3 gap-y-1 border border-outline-variant/50 rounded-md px-2 py-1.5"
            >
              <span className="text-on-surface font-semibold">{m.fullName}</span>
              <span>{m.slug}</span>
              <span>
                {m.liveSessionPriceCents === 0
                  ? '$0'
                  : `$${(m.liveSessionPriceCents / 100).toFixed(0)}/hr`}
              </span>
              <span>{m.isListed ? 'listed' : 'hidden'}</span>
              {m.bookHref ? (
                <a href={m.bookHref} className="text-primary underline">
                  book
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
