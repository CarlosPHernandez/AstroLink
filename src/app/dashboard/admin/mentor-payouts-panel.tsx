'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatMoney, formatSessionWhen } from '@/lib/format';

type MentorSummary = {
  mentorId: string;
  fullName: string;
  awaitingCents: number;
};

type UnpaidTransaction = {
  id: string;
  bookingId: string;
  menteeName: string;
  scheduledAt: string;
  mentorPayoutCents: number;
  createdAt: string;
};

export function MentorPayoutsPanel() {
  const [mentors, setMentors] = useState<MentorSummary[]>([]);
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [unpaidTransactions, setUnpaidTransactions] = useState<UnpaidTransaction[]>([]);
  const [awaitingCents, setAwaitingCents] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [referenceNote, setReferenceNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadMentors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/mentor-payouts');
      const json = (await response.json()) as {
        success?: boolean;
        mentors?: MentorSummary[];
        error?: string;
      };
      if (!response.ok || !json.success || !json.mentors) {
        throw new Error(
          typeof json.error === 'string' ? json.error : 'Could not load mentors awaiting payout.',
        );
      }
      setMentors(json.mentors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load mentor payouts.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMentorDetail = useCallback(async (mentorId: string) => {
    if (!mentorId) {
      setUnpaidTransactions([]);
      setAwaitingCents(0);
      setSelectedIds(new Set());
      return;
    }

    setDetailLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/mentor-payouts?mentorId=${mentorId}`);
      const json = (await response.json()) as {
        success?: boolean;
        mentor?: { awaitingCents: number };
        unpaidTransactions?: UnpaidTransaction[];
        error?: string;
      };
      if (!response.ok || !json.success || !json.mentor || !json.unpaidTransactions) {
        throw new Error(
          typeof json.error === 'string' ? json.error : 'Could not load unpaid sessions.',
        );
      }
      setAwaitingCents(json.mentor.awaitingCents);
      setUnpaidTransactions(json.unpaidTransactions);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load unpaid sessions.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMentors();
  }, [loadMentors]);

  useEffect(() => {
    if (mentors.length > 0 && !selectedMentorId) {
      setSelectedMentorId(mentors[0]!.mentorId);
    }
  }, [mentors, selectedMentorId]);

  useEffect(() => {
    void loadMentorDetail(selectedMentorId);
  }, [selectedMentorId, loadMentorDetail]);

  function toggleTransaction(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function markPaid() {
    if (!selectedMentorId || selectedIds.size === 0) {
      setError('Select at least one session to mark paid.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/admin/mentor-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: selectedMentorId,
          transactionIds: [...selectedIds],
          referenceNote: referenceNote.trim() || undefined,
        }),
      });
      const json = (await response.json()) as {
        success?: boolean;
        error?: string;
        totalCents?: number;
        lineCount?: number;
      };

      if (!response.ok || !json.success) {
        throw new Error(
          typeof json.error === 'string' ? json.error : 'Could not mark sessions paid.',
        );
      }

      setSuccess(
        `Marked ${json.lineCount ?? selectedIds.size} session(s) paid (${formatMoney(json.totalCents ?? 0)}).`,
      );
      setReferenceNote('');
      await Promise.all([loadMentors(), loadMentorDetail(selectedMentorId)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not mark sessions paid.');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTotal = unpaidTransactions
    .filter((row) => selectedIds.has(row.id))
    .reduce((sum, row) => sum + row.mentorPayoutCents, 0);

  return (
    <div
      className="p-6 rounded-md border border-outline-variant bg-surface-container-lowest shadow-sm"
      data-testid="admin-mentor-payouts"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Mentor payouts
        </h2>
        <button
          type="button"
          onClick={() => void Promise.all([loadMentors(), loadMentorDetail(selectedMentorId)])}
          disabled={loading || detailLoading}
          className="text-xs text-on-surface-variant hover:text-on-surface disabled:opacity-40 transition-colors"
        >
          Refresh
        </button>
      </div>

      <p className="text-sm text-on-surface-variant mb-4">
        Mark bank transfers for recorded mentor sessions. Each line item links to one booking
        payment.
      </p>

      {loading ? (
        <p className="text-on-surface-variant text-xs font-mono">Loading mentors…</p>
      ) : mentors.length === 0 ? (
        <p className="text-on-surface-variant text-sm" data-testid="admin-mentor-payouts-empty">
          No mentors have sessions awaiting transfer.
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="admin-mentor-picker"
              className="block text-xs font-medium text-on-surface-variant mb-1"
            >
              Mentor
            </label>
            <select
              id="admin-mentor-picker"
              data-testid="admin-mentor-picker"
              value={selectedMentorId}
              onChange={(event) => setSelectedMentorId(event.target.value)}
              className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
            >
              {mentors.map((mentor) => (
                <option key={mentor.mentorId} value={mentor.mentorId}>
                  {mentor.fullName} — {formatMoney(mentor.awaitingCents)} awaiting
                </option>
              ))}
            </select>
          </div>

          {detailLoading ? (
            <p className="text-on-surface-variant text-xs font-mono">Loading unpaid sessions…</p>
          ) : unpaidTransactions.length === 0 ? (
            <p className="text-on-surface-variant text-sm">
              No unpaid recorded sessions for this mentor.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-outline-variant">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 font-medium">Select</th>
                    <th className="px-4 py-3 font-medium">Session</th>
                    <th className="px-4 py-3 font-medium">Buyer</th>
                    <th className="px-4 py-3 font-medium">Mentor share</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidTransactions.map((row) => (
                    <tr key={row.id} className="border-b border-outline-variant/40 last:border-0">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleTransaction(row.id)}
                          data-testid={`admin-payout-select-${row.id}`}
                          aria-label={`Select payout for ${row.menteeName}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-on-surface">
                        <span suppressHydrationWarning>
                          {formatSessionWhen(row.scheduledAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">{row.menteeName}</td>
                      <td className="px-4 py-3 font-medium text-on-surface">
                        {formatMoney(row.mentorPayoutCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-on-surface-variant">
            Mentor awaiting transfer: {formatMoney(awaitingCents)}
            {selectedIds.size > 0 ? ` · Selected: ${formatMoney(selectedTotal)}` : null}
          </p>

          <div>
            <label
              htmlFor="admin-payout-reference"
              className="block text-xs font-medium text-on-surface-variant mb-1"
            >
              Bank reference (optional)
            </label>
            <input
              id="admin-payout-reference"
              type="text"
              value={referenceNote}
              onChange={(event) => setReferenceNote(event.target.value)}
              placeholder="Wire memo or transfer ID"
              className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
            />
          </div>

          <button
            type="button"
            onClick={() => void markPaid()}
            disabled={submitting || selectedIds.size === 0}
            data-testid="admin-mark-paid"
            className="cursor-pointer rounded-md bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-primary-container disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Mark selected paid'}
          </button>
        </div>
      )}

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert" data-testid="admin-mentor-payouts-error">
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          className="mt-4 text-sm text-emerald-800"
          data-testid="admin-mentor-payouts-success"
        >
          {success}
        </p>
      ) : null}
    </div>
  );
}