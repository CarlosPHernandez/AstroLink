import type {
  PathAssessmentAnswers,
  PathAssessmentReport,
} from '@/lib/path-assessment/schema';

/**
 * Deterministic non-LLM report so submit never dead-ends if Gemini fails.
 */
export function buildFallbackPathAssessmentReport(
  answers: PathAssessmentAnswers,
): PathAssessmentReport {
  const name = answers.firstName.trim() || 'there';
  const stage = answers.stage;
  const goalSnippet = answers.primaryGoal.trim().slice(0, 120);
  const obstacleSnippet = answers.obstacle.trim().slice(0, 100);
  const network = answers.network;

  const networkGap =
    network === 'None' || network === '1–2 people'
      ? {
          title: 'Limited operator network',
          detail: `You described your network as “${network}.” Warm intros and operator conversations often unlock clearer paths faster than solo research.`,
        }
      : {
          title: 'Convert network into targeted advice',
          detail: `You have some network already (${network}). The next step is structured conversations tied to your specific 12–24 month goal—not more general outreach.`,
        };

  return {
    headline: `${name}, you have a clear direction — focus is the unlock`,
    standing_summary: `As a ${stage.toLowerCase()}, you’re aiming at: ${goalSnippet}${answers.primaryGoal.length > 120 ? '…' : ''}. Your background notes give experts something concrete to work with. The main friction you named — ${obstacleSnippet}${answers.obstacle.length > 100 ? '…' : ''} — is a classic readiness gap: it responds well to a short, focused conversation with someone who has done adjacent work.`,
    key_gaps: [
      {
        title: 'Translate goals into a 90-day plan',
        detail:
          'Your 12–24 month goal is useful, but experts help most when it is broken into near-term milestones, skills, and proof points they can critique live.',
      },
      networkGap,
      {
        title: 'Pressure-test the biggest obstacle',
        detail: `You flagged: “${obstacleSnippet}${answers.obstacle.length > 100 ? '…' : ''}.” A live expert can separate real blockers from noise and suggest the next experiment.`,
      },
    ],
    focus_areas: [
      'Clarify 12–24 month outcome in operator language',
      'Build one proof artifact experts can review',
      network === 'None' || network === '1–2 people'
        ? 'Open 2–3 high-signal conversations'
        : 'Deepen 1–2 mentor-grade relationships',
    ],
    expert_conversation_type: `A live 1:1 path-review with an aerospace operator who can map your ${stage.toLowerCase()} stage to concrete next steps on your stated goal.`,
    next_actions: [
      {
        action: 'Write a one-page “current standing” note (goal, skills, proof, ask).',
        why: 'Gives any expert a shared map so the call is tactical, not introductory.',
      },
      {
        action: 'List three questions only an operator can answer well.',
        why: 'Protects live time for advice you cannot get from blogs or job posts.',
      },
      {
        action: 'Book a live expert review and bring this assessment as context.',
        why: 'Attaching your report lets the expert prepare specific, situation-aware advice.',
      },
    ],
    upsell_bridge_live:
      'Want a verified expert to review this report with you live? We’ll load your assessment so they can prepare for your situation.',
    upsell_bridge_written:
      'A written expert review of this report is coming later — for now, a live conversation is the best next step.',
  };
}
