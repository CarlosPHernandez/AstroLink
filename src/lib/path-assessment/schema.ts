import { z } from 'zod';

/** Career stage options for the free Space Path Assessment. */
export const PATH_ASSESSMENT_STAGES = [
  'Student',
  'Early career',
  'Career switcher',
  'Experienced professional',
  'Other',
] as const;

export type PathAssessmentStage = (typeof PATH_ASSESSMENT_STAGES)[number];

/** Network strength options. */
export const PATH_ASSESSMENT_NETWORKS = [
  'None',
  '1–2 people',
  'Small network',
  'Strong network',
] as const;

export type PathAssessmentNetwork = (typeof PATH_ASSESSMENT_NETWORKS)[number];

export const PathAssessmentStageSchema = z.enum(PATH_ASSESSMENT_STAGES);
export const PathAssessmentNetworkSchema = z.enum(PATH_ASSESSMENT_NETWORKS);

export const PathAssessmentAnswersSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: 'Enter your first name.' })
    .max(80, { message: 'First name is too long.' }),
  email: z
    .string()
    .trim()
    .email({ message: 'Enter a valid email.' })
    .max(254, { message: 'Email is too long.' }),
  stage: PathAssessmentStageSchema,
  primaryGoal: z
    .string()
    .trim()
    .min(10, { message: 'Add a bit more about your goal (at least 10 characters).' })
    .max(800, { message: 'Keep your goal under 800 characters.' }),
  experience: z
    .string()
    .trim()
    .min(10, { message: 'Add a bit more about your background (at least 10 characters).' })
    .max(1200, { message: 'Keep background under 1200 characters.' }),
  network: PathAssessmentNetworkSchema,
  obstacle: z
    .string()
    .trim()
    .min(10, { message: 'Add a bit more about your biggest obstacle (at least 10 characters).' })
    .max(800, { message: 'Keep this under 800 characters.' }),
});

export type PathAssessmentAnswers = z.infer<typeof PathAssessmentAnswersSchema>;

/** POST /api/path-assessment body (answers + honeypot). */
export const PathAssessmentSubmitBodySchema = PathAssessmentAnswersSchema.extend({
  /** Honeypot — real UI never fills this. */
  website: z.string().max(200).optional(),
});

export type PathAssessmentSubmitBody = z.infer<typeof PathAssessmentSubmitBodySchema>;

export const PathAssessmentKeyGapSchema = z.object({
  title: z.string(),
  detail: z.string(),
});

export const PathAssessmentNextActionSchema = z.object({
  action: z.string(),
  why: z.string(),
});

export const PathAssessmentReportSchema = z.object({
  headline: z.string(),
  standing_summary: z.string(),
  key_gaps: z.array(PathAssessmentKeyGapSchema).min(1).max(4),
  focus_areas: z.array(z.string()).min(1).max(6),
  expert_conversation_type: z.string(),
  next_actions: z.array(PathAssessmentNextActionSchema).min(1).max(5),
  upsell_bridge_live: z.string(),
  /** Reserved for PR-B written review product — not shown in PR-A UI/email. */
  upsell_bridge_written: z.string().optional(),
});

export type PathAssessmentReport = z.infer<typeof PathAssessmentReportSchema>;
export type PathAssessmentKeyGap = z.infer<typeof PathAssessmentKeyGapSchema>;
export type PathAssessmentNextAction = z.infer<typeof PathAssessmentNextActionSchema>;

export type PathAssessmentStatus = 'pending' | 'ready' | 'failed';

/** Public GET payload (no internal UUID). */
export type PathAssessmentPublicView = {
  token: string;
  status: PathAssessmentStatus;
  firstName: string;
  answers: PathAssessmentAnswers;
  report: PathAssessmentReport | null;
  reportHtml: string | null;
  createdAt: string;
};
