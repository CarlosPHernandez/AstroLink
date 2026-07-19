import { normalizeLandingGoal } from '@/lib/landing/hero-relay';

/** Suggested path chips — not real user goals; never persist to Supabase. */
export const LANDING_PATH_CHIPS = [
  {
    id: 'student',
    label: 'Student',
    goal: 'I am a student exploring a career in space. Where should I start?',
  },
  {
    id: 'career',
    label: 'Career switcher',
    goal: 'I want to switch into aerospace. What paths actually work?',
  },
  {
    id: 'team',
    label: 'Team / org',
    goal: 'Our team needs operator perspective on a space project. How do we get started?',
  },
] as const;

const SUGGESTED_GOAL_SET = new Set(
  LANDING_PATH_CHIPS.map((chip) => normalizeLandingGoal(chip.goal)),
);

export function isLandingSuggestedPathGoal(goal: string): boolean {
  return SUGGESTED_GOAL_SET.has(normalizeLandingGoal(goal));
}
