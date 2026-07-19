import 'server-only';

import {
  landingRelayReplyCta,
  type LandingRelayExpert,
} from '@/lib/landing/featured-expert';
import { isE2eStubLlmEnabled, llmFlashModel, generatePlainText } from '@/lib/llm';

export function isLandingRelayLlmEnabled(): boolean {
  const flag = process.env.LANDING_RELAY_LLM_ENABLED?.trim().toLowerCase();
  if (flag === 'false' || flag === '0') {
    return false;
  }
  return true;
}

function parseTeaserJson(raw: string): { teaser: string; cta: string } | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '');
    const parsed = JSON.parse(cleaned) as { teaser?: unknown; cta?: unknown };
    const teaser = typeof parsed.teaser === 'string' ? parsed.teaser.trim() : '';
    const cta = typeof parsed.cta === 'string' ? parsed.cta.trim() : '';
    if (!teaser || teaser.length < 20) {
      return null;
    }
    return {
      teaser: teaser.slice(0, 420),
      cta: (cta || '').slice(0, 200) || '',
    };
  } catch {
    return null;
  }
}

function stubTeaser(goal: string, expert: LandingRelayExpert): { teaser: string; cta: string } {
  const snippet = goal.length > 80 ? `${goal.slice(0, 77)}…` : goal;
  return {
    teaser: `For “${snippet}” — a verified expert like ${expert.firstName} can walk through what actually works, not a generic search summary. This is an illustrative preview, not a live session.`,
    cta: landingRelayReplyCta(expert),
  };
}

/**
 * Generate a short illustrative teaser. Landing has its own submit/LLM budgets;
 * generatePlainText still applies product-wide LLM rate limits as a backstop.
 */
export async function generateLandingRelayTeaser(params: {
  goal: string;
  expert: LandingRelayExpert;
}): Promise<{ teaser: string; cta: string } | null> {
  const { goal, expert } = params;

  if (isE2eStubLlmEnabled()) {
    return stubTeaser(goal, expert);
  }

  if (!isLandingRelayLlmEnabled()) {
    return null;
  }

  const systemInstruction = [
    'You write short illustrative previews for AstroLink, a marketplace for live 1:1 video with verified aerospace experts.',
    'You are NOT the named expert and must not claim this is a real booking or personal advice from them.',
    'Tone: warm, specific, practical. React to a concrete detail in the user goal.',
    'Return ONLY valid JSON: {"teaser":"...","cta":"..."}',
    'teaser: 40-90 words, 1-2 short paragraphs max.',
    'cta: one sentence inviting them to view the expert profile or create an account.',
    'No medical, legal, or investment advice. No markdown fences.',
  ].join(' ');

  const prompt = [
    `Matched expert (for tone only): ${expert.name} — ${expert.role}`,
    `User learning goal: ${goal}`,
    'Write teaser + cta JSON now.',
  ].join('\n');

  try {
    const raw = await generatePlainText({
      model: llmFlashModel,
      systemInstruction,
      prompt,
      // Dedicated key so per-user product limits do not collide with authenticated LLM users
      rateLimitKey: `landing-relay:${expert.slug}`,
    });

    const parsed = parseTeaserJson(raw);
    if (!parsed) {
      // Sometimes models return plain text — use as teaser
      const plain = raw.trim().slice(0, 420);
      if (plain.length >= 20) {
        return { teaser: plain, cta: landingRelayReplyCta(expert) };
      }
      return null;
    }
    if (!parsed.cta) {
      parsed.cta = landingRelayReplyCta(expert);
    }
    return parsed;
  } catch (error) {
    console.warn('[landing-relay] LLM teaser failed', error);
    return null;
  }
}
