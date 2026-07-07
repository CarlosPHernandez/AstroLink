'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChrisSegmentedProgress } from '@/components/chris-campaign/chris-segmented-progress';
import type { BriefingPayload } from '@/lib/briefing-display';
import {
  formatMenteeBriefAsPlainText,
  isLegacySessionBriefing,
  isPreCallBrief,
  resolveMenteeBrief,
} from '@/lib/briefing-display';

type ChrisBriefingModalProps = {
  mentorName: string;
  briefing: BriefingPayload;
  userEmail?: string;
  bookingId: string;
  onClose: () => void;
};

const sectionLabelClass =
  'mb-[0.5rem] text-[10px] font-medium uppercase tracking-widest text-white/50';

const agendaBlockClass =
  'rounded-lg border border-[#333333] bg-[#111111] p-[0.75rem]';

function ChrisBriefSections({ briefing }: { briefing: BriefingPayload }) {
  const mentee = resolveMenteeBrief(briefing);

  if (mentee) {
    return (
      <div className="flex flex-col gap-[1rem]">
        <section className={`${agendaBlockClass} p-[1rem]`}>
          <p className="text-sm leading-relaxed text-white/90">{mentee.personal_intro}</p>
        </section>

        <section>
          <h3 className={sectionLabelClass}>Your objectives</h3>
          <ul className="flex flex-col gap-[0.5rem]">
            {mentee.session_objectives.map((objective) => (
              <li
                key={objective}
                className="border-l-2 border-[#5b7fe6]/50 pl-[0.75rem] text-sm leading-snug text-white/90"
              >
                {objective}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className={sectionLabelClass}>Your session plan</h3>
          <div className="flex flex-col gap-[0.5rem]">
            {(
              [
                ['0–5 min', mentee.recommended_agenda.minutes_0_5],
                ['5–20 min', mentee.recommended_agenda.minutes_5_20],
                ['20–28 min', mentee.recommended_agenda.minutes_20_28],
                ['28–30 min', mentee.recommended_agenda.minutes_28_30],
              ] as const
            ).map(([label, text]) => (
              <div key={label} className={agendaBlockClass}>
                <span className="text-[9px] font-mono uppercase tracking-wider text-[#5b7fe6]">
                  {label}
                </span>
                <p className="mt-[0.25rem] text-xs leading-relaxed text-white/75">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {mentee.questions_to_ask.length > 0 ? (
          <section>
            <h3 className={sectionLabelClass}>Questions to ask</h3>
            <ol className="list-decimal space-y-[0.5rem] pl-[1rem] text-xs leading-relaxed text-white/75">
              {mentee.questions_to_ask.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    );
  }

  if (isLegacySessionBriefing(briefing)) {
    return (
      <div className="flex flex-col gap-[1rem]">
        <section>
          <h3 className={sectionLabelClass}>Session objectives</h3>
          <ul className="flex flex-col gap-[0.5rem]">
            {briefing.session_objectives.map((objective) => (
              <li key={objective} className="text-sm text-white/90">
                {objective}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <p className="text-sm leading-relaxed text-white/70">
            {briefing.mentee_context_summary}
          </p>
        </section>
      </div>
    );
  }

  if (isPreCallBrief(briefing)) {
    return (
      <div className="flex flex-col gap-[1rem]">
        <p className="text-sm text-white">{briefing.one_line_summary}</p>
        <p className="text-sm leading-relaxed text-white/70">{briefing.buyer_context_summary}</p>
      </div>
    );
  }

  return null;
}

export function ChrisBriefingModal({
  mentorName,
  briefing,
  userEmail,
  bookingId,
  onClose,
}: ChrisBriefingModalProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [emailState, setEmailState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  if (typeof document === 'undefined') {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatMenteeBriefAsPlainText(briefing));
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('error');
    }
  };

  const handleSendEmail = async () => {
    setEmailState('sending');
    setEmailError(null);
    try {
      const res = await fetch('/api/book/briefing/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Could not send email');
      }
      setEmailState('sent');
    } catch (err) {
      setEmailState('error');
      setEmailError(err instanceof Error ? err.message : 'Could not send email');
    }
  };

  return createPortal(
    <div
      className="chris-landing fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-[1rem] backdrop-blur-sm md:items-center"
      onClick={onClose}
      onKeyDown={() => {}}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chris-briefing-title"
        data-testid="chris-briefing-modal"
        className="chris-brief-panel chris-fade-in-up"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 flex-col gap-[1rem] border-b border-[#333333] px-[1rem] py-[1rem]">
          <div className="flex items-start justify-between gap-[0.75rem]">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-widest text-[#5b7fe6]">
                Pre-call brief
              </p>
              <h2 id="chris-briefing-title" className="text-base font-semibold text-white">
                Session with {mentorName}
              </h2>
            </div>
            <button
              type="button"
              data-testid="chris-brief-close"
              onClick={onClose}
              className="shrink-0 rounded-md border border-[#333333] px-[0.5rem] py-[0.25rem] text-sm text-white/70 transition-colors hover:text-white"
              aria-label="Close brief"
            >
              ✕
            </button>
          </div>
          <ChrisSegmentedProgress
            totalSegments={4}
            filledSegments={4}
            label="Your brief is ready"
            testId="chris-brief-progress"
          />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-[1rem] py-[1rem]">
          <ChrisBriefSections briefing={briefing} />
        </div>

        <footer className="shrink-0 border-t border-[#333333] p-[1rem]">
          <div className="flex flex-col gap-[0.5rem]">
            <button
              type="button"
              data-testid="chris-brief-email"
              disabled={emailState === 'sending'}
              onClick={() => void handleSendEmail()}
              className="w-full rounded-lg bg-white py-sm text-sm font-bold tracking-tight text-[#1c1c1c] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {emailState === 'sending'
                ? 'Sending…'
                : emailState === 'sent'
                  ? 'Send again'
                  : 'Send to my email'}
            </button>
            {emailState === 'sent' ? (
              <p className="text-center text-xs text-[#4ade80]">
                Sent{userEmail ? ` to ${userEmail}` : ''}
              </p>
            ) : null}
            <button
              type="button"
              data-testid="chris-brief-copy"
              onClick={() => void handleCopy()}
              className="w-full rounded-lg border border-[#333333] py-sm text-sm font-semibold text-white/80 transition-colors hover:bg-[#111111] hover:text-white"
            >
              {copyState === 'copied' ? 'Copied!' : copyState === 'error' ? 'Copy failed' : 'Copy brief'}
            </button>
          </div>
          {emailError ? (
            <p className="mt-[0.5rem] text-center text-xs text-red-400">{emailError}</p>
          ) : null}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
