'use client';

import React, { useCallback, useEffect, useState } from 'react';

type ExpertApplicationSummary = {
  id: string;
  fullName: string;
  email: string;
  employer: string;
  hourlyRateCents: number;
  services: string[];
  status: string;
  createdAt: string;
  isCivilServant: boolean;
};

function formatRate(cents: number): string {
  return `$${(cents / 100).toFixed(0)}/hr`;
}

function formatSubmitted(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ExpertApplicationsPanel() {
  const [applications, setApplications] = useState<ExpertApplicationSummary[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setListError(null);
    try {
      const response = await fetch('/api/admin/expert-applications');
      const json = (await response.json()) as {
        success?: boolean;
        applications?: ExpertApplicationSummary[];
        error?: string;
      };
      if (!response.ok || !json.success || !json.applications) {
        throw new Error(json.error ?? 'Failed to load applications');
      }
      setApplications(json.applications);
    } catch (error: unknown) {
      setListError(error instanceof Error ? error.message : 'Failed to load applications');
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadApplications();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loadApplications]);

  const decide = async (id: string, decision: 'approve' | 'decline') => {
    setBusyId(id);
    setActionError(null);
    setActionMessage(null);
    try {
      const response = await fetch('/api/admin/expert-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, decision }),
      });
      const json = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? 'Could not review application');
      }
      setActionMessage(
        decision === 'approve' ? 'Approved as an unlisted mentor.' : 'Application declined.',
      );
      await loadApplications();
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : 'Could not review application');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 rounded-md border border-outline-variant bg-surface-container-lowest shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Expert applications
          </h2>
          <p className="text-on-surface-variant text-xs mt-1">
            Approve to create an unlisted mentor, or decline. No email is sent.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadApplications()}
          className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Refresh
        </button>
      </div>

      {listError ? (
        <p className="text-xs text-error" role="alert">
          {listError}
        </p>
      ) : null}
      {actionError ? (
        <p className="text-xs text-error mb-2" role="alert">
          {actionError}
        </p>
      ) : null}
      {actionMessage ? <p className="text-xs text-primary mb-2">{actionMessage}</p> : null}

      {applications.length === 0 && !listError ? (
        <p className="text-xs text-on-surface-variant">No applications yet.</p>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {applications.map((application) => (
            <li
              key={application.id}
              className="text-xs text-on-surface-variant border border-outline-variant/50 rounded-md px-2 py-2 space-y-2"
            >
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span className="text-on-surface font-semibold">{application.fullName}</span>
                <span>{application.email}</span>
                <span>{application.employer}</span>
                <span>{formatRate(application.hourlyRateCents)}</span>
                <span>{application.services.join(', ') || 'No live services'}</span>
                <span>{application.isCivilServant ? 'Civil servant' : 'Not a civil servant'}</span>
                <span>{application.status}</span>
                <span>{formatSubmitted(application.createdAt)}</span>
              </div>
              {application.status === 'submitted' ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === application.id}
                    onClick={() => void decide(application.id, 'approve')}
                    className="px-2.5 py-1.5 rounded-md bg-primary text-white text-[10px] font-semibold uppercase tracking-wider disabled:opacity-50"
                  >
                    {busyId === application.id ? 'Saving…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === application.id}
                    onClick={() => void decide(application.id, 'decline')}
                    className="px-2.5 py-1.5 rounded-md border border-outline-variant text-on-surface-variant hover:text-on-surface text-[10px] font-semibold uppercase tracking-wider disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
