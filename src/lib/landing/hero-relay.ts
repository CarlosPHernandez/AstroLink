import {
  landingRelayReplyCta,
  landingRelayReplyIntro,
  type LandingRelayExpert,
} from '@/lib/landing/featured-expert';

export const LANDING_GOAL_MAX_CHARS = 280;

export type LandingRelayReplySource = 'llm' | 'cache' | 'fallback';

export type LandingRelayChatMessage = {
  role: 'user' | 'expert';
  text: string;
};

export function normalizeLandingGoal(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LANDING_GOAL_MAX_CHARS);
}

export function buildFallbackRelayMessages(
  goal: string,
  expert: LandingRelayExpert,
): LandingRelayChatMessage[] {
  return [
    { role: 'user', text: goal },
    { role: 'expert', text: landingRelayReplyIntro(expert) },
    { role: 'expert', text: landingRelayReplyCta(expert) },
  ];
}

export function buildRelayMessagesFromTeaser(
  goal: string,
  teaser: string,
  cta: string,
): LandingRelayChatMessage[] {
  return [
    { role: 'user', text: goal },
    { role: 'expert', text: teaser },
    { role: 'expert', text: cta },
  ];
}
