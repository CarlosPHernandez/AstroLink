'use client';

import { useState } from 'react';

import { SessionTranscriptPanel } from '@/components/session/session-transcript-panel';

type DashboardSessionTranscriptProps = {
  bookingId: string;
  mentorName: string;
  menteeName: string;
  viewerRole: 'mentee' | 'mentor' | 'admin';
  testIdPrefix: string;
};

export function DashboardSessionTranscript({
  bookingId,
  mentorName,
  menteeName,
  viewerRole,
  testIdPrefix,
}: DashboardSessionTranscriptProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 w-full" data-testid={`${testIdPrefix}-transcript`}>
      <button
        type="button"
        data-testid={`${testIdPrefix}-transcript-toggle`}
        onClick={() => setOpen((value) => !value)}
        className="text-[10px] font-semibold uppercase tracking-wider text-primary hover:underline cursor-pointer"
      >
        {open ? 'Hide transcript' : 'View transcript'}
      </button>
      {open ? (
        <div className="mt-3">
          <SessionTranscriptPanel
            bookingId={bookingId}
            mentorName={mentorName}
            menteeName={menteeName}
            viewerRole={viewerRole}
          />
        </div>
      ) : null}
    </div>
  );
}
