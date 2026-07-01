'use client';

import type { BriefingAgenda } from '@/lib/types';
import type { BriefingPayload } from '@/lib/briefing-display';
import {
  briefingContentReady,
  isLegacySessionBriefing,
  isPreCallBrief,
  isSessionBriefingBundle,
  needsBriefingUpgrade,
  resolveExpertBrief,
  resolveMenteeBrief,
} from '@/lib/briefing-display';

export { briefingContentReady };
import { BriefingUpgradeBanner } from '@/components/briefing/briefing-upgrade-banner';

function AgendaBlocks({ agenda }: { agenda: BriefingAgenda }) {
  return (
    <div className="space-y-3">
      {(
        [
          ['0–5 min', agenda.minutes_0_5],
          ['5–20 min', agenda.minutes_5_20],
          ['20–28 min', agenda.minutes_20_28],
          ['28–30 min', agenda.minutes_28_30],
        ] as const
      ).map(([label, text]) => (
        <div
          key={label}
          className="p-3 rounded-md bg-surface-container-low border border-outline-variant/40"
        >
          <span className="block text-[9px] font-mono font-bold text-primary uppercase mb-1">
            {label}
          </span>
          <p className="text-xs text-on-surface-variant leading-relaxed">{text}</p>
        </div>
      ))}
    </div>
  );
}

function ObjectivesList({ objectives }: { objectives: string[] }) {
  return (
    <ul className="space-y-2">
      {objectives.map((obj) => (
        <li
          key={obj}
          className="text-sm text-on-surface leading-relaxed pl-4 border-l-2 border-primary/40"
        >
          {obj}
        </li>
      ))}
    </ul>
  );
}

function ResourcesList({ resources }: { resources: string[] }) {
  if (resources.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
        Suggested resources
      </h3>
      <ul className="list-disc pl-5 text-xs text-on-surface-variant space-y-1">
        {resources.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </section>
  );
}

function MenteeLiveBrief({
  briefing,
  onRegenerate,
}: {
  briefing: BriefingPayload;
  onRegenerate?: () => void;
}) {
  const mentee = resolveMenteeBrief(briefing);

  if (mentee) {
    return (
      <div className="space-y-6 animate-fade-slide-up">
        <section className="p-4 rounded-md bg-primary/5 border border-primary/20">
          <p className="text-sm text-on-surface leading-relaxed">{mentee.personal_intro}</p>
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
            Your objectives
          </h3>
          <ObjectivesList objectives={mentee.session_objectives} />
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
            Your session plan
          </h3>
          <AgendaBlocks agenda={mentee.recommended_agenda} />
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Your context
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">{mentee.your_context}</p>
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Questions to ask
          </h3>
          <ol className="list-decimal pl-5 text-xs text-on-surface-variant space-y-2">
            {mentee.questions_to_ask.map((q) => (
              <li key={q} className="leading-relaxed">
                {q}
              </li>
            ))}
          </ol>
        </section>

        <ResourcesList resources={mentee.suggested_resources} />
      </div>
    );
  }

  if (isLegacySessionBriefing(briefing)) {
    return (
      <div className="space-y-6 animate-fade-slide-up">
        <BriefingUpgradeBanner onRegenerate={onRegenerate} />

        <section>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
            Session objectives
          </h3>
          <ObjectivesList objectives={briefing.session_objectives} />
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
            Recommended agenda
          </h3>
          <AgendaBlocks agenda={briefing.recommended_agenda} />
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Your context
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {briefing.mentee_context_summary}
          </p>
        </section>

        <ResourcesList resources={briefing.suggested_resources} />
      </div>
    );
  }

  return null;
}

function MentorLiveBrief({ briefing }: { briefing: BriefingPayload }) {
  const expert = resolveExpertBrief(briefing);
  if (!expert) {
    return null;
  }

  const facilitationNotes =
    'facilitation_notes' in expert ? expert.facilitation_notes : [];

  return (
    <div className="space-y-6 animate-fade-slide-up">
      <section>
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
          Session objectives
        </h3>
        <ObjectivesList objectives={expert.session_objectives} />
      </section>

      <section>
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
          Recommended agenda
        </h3>
        <AgendaBlocks agenda={expert.recommended_agenda} />
      </section>

      <section>
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
          Mentee context
        </h3>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {expert.mentee_context_summary}
        </p>
      </section>

      {facilitationNotes.length > 0 ? (
        <section>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Facilitation notes
          </h3>
          <ul className="list-disc pl-5 text-xs text-on-surface-variant space-y-1">
            {facilitationNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <ResourcesList resources={expert.suggested_resources} />
    </div>
  );
}

function PreCallBriefContent({ briefing }: { briefing: BriefingPayload }) {
  if (!isPreCallBrief(briefing)) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-slide-up">
      <section className="p-4 rounded-md bg-primary/5 border border-primary/20">
        <p className="text-sm text-on-surface leading-relaxed">{briefing.one_line_summary}</p>
        <p className="text-[10px] font-mono text-on-surface-variant mt-2 uppercase tracking-wider">
          Readiness {Math.round(briefing.session_readiness_score * 100)}%
        </p>
      </section>

      <section>
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
          Context summary
        </h3>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {briefing.buyer_context_summary}
        </p>
      </section>

      <section>
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
          Your strengths
        </h3>
        <ul className="list-disc pl-5 text-xs text-on-surface-variant space-y-1">
          {briefing.buyer_strengths.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
          Focus areas
        </h3>
        <div className="space-y-3">
          {briefing.focus_areas.map((area) => (
            <div
              key={area.topic}
              className="p-3 rounded-md bg-surface-container-low border border-outline-variant/40"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-on-surface">{area.topic}</span>
                <span className="text-[9px] font-mono uppercase text-on-surface-variant">
                  {area.severity}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">{area.why_for_expert}</p>
              <p className="text-xs text-on-surface mt-2 italic">{area.suggested_angle}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
          Questions for your expert
        </h3>
        <ol className="list-decimal pl-5 text-xs text-on-surface-variant space-y-2">
          {briefing.proposed_questions.map((q) => (
            <li key={q} className="leading-relaxed">
              {q}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function BriefingContent({
  briefing,
  audience,
  onRegenerate,
}: {
  briefing: BriefingPayload;
  audience: 'mentee' | 'mentor';
  onRegenerate?: () => void;
}) {
  if (isPreCallBrief(briefing)) {
    return audience === 'mentee' ? <PreCallBriefContent briefing={briefing} /> : null;
  }

  if (isSessionBriefingBundle(briefing) || isLegacySessionBriefing(briefing)) {
    return audience === 'mentee' ? (
      <MenteeLiveBrief briefing={briefing} onRegenerate={onRegenerate} />
    ) : (
      <MentorLiveBrief briefing={briefing} />
    );
  }

  return null;
}

export { needsBriefingUpgrade };