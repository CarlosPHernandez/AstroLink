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

/** Hard cap so phone UI stays a hook, not a free mini-session. */
const TEASER_MAX_CHARS = 220;

function parseTeaserJson(raw: string): string | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '');
    const parsed = JSON.parse(cleaned) as { teaser?: unknown; cta?: unknown };
    // Accept legacy { teaser, cta } or plain { teaser }
    const teaser = typeof parsed.teaser === 'string' ? parsed.teaser.trim() : '';
    if (!teaser || teaser.length < 16) {
      return null;
    }
    return teaser.slice(0, TEASER_MAX_CHARS);
  } catch {
    return null;
  }
}

function stubTeaser(goal: string, expert: LandingRelayExpert): { teaser: string; cta: string } {
  const snippet = goal.length > 56 ? `${goal.slice(0, 53)}…` : goal;
  return {
    teaser: `For “${snippet}” — the useful next step is usually specific, not another generic search summary.`,
    cta: landingRelayReplyCta(expert),
  };
}

/**
 * Generate a short illustrative teaser. Landing has its own submit/LLM budgets;
 * generatePlainText still applies product-wide LLM rate limits as a backstop.
 * CTA copy is fixed (not LLM) so the chat never doubles a book pitch.
 */
export async function generateLandingRelayTeaser(params: {
  goal: string;
  expert: LandingRelayExpert;
}): Promise<{ teaser: string; cta: string } | null> {
  const { goal, expert } = params;
  const cta = landingRelayReplyCta(expert);

  if (isE2eStubLlmEnabled()) {
    return stubTeaser(goal, expert);
  }

  if (!isLandingRelayLlmEnabled()) {
    return null;
  }

  const systemInstruction = [
    'You write short illustrative previews for AstroLink, a marketplace for live 1:1 video with verified aerospace experts.',
    'You are NOT the named expert and must not claim this is a real booking or personal advice from them.',
    'Goal: hook the visitor — do NOT give a complete plan, checklist, or multi-step answer.',
    'Do NOT invite them to book, create an account, or continue — the product UI handles that.',
    'Tone: warm, specific, practical. React to one concrete detail in the user goal, then stop.',
    'Return ONLY valid JSON: {"teaser":"..."}',
    'teaser: 20-40 words, 1-2 short sentences max. Leave the rest for a live session.',
    'No medical, legal, or investment advice. No markdown fences.',
  ].join(' ');

  const prompt = [
    `Matched expert (for tone only): ${expert.name} — ${expert.role}`,
    `User learning goal: ${goal}`,
    'Write short teaser JSON now.',
  ].join('\n');

  try {
    const raw = await generatePlainText({
      model: llmFlashModel,
      systemInstruction,
      prompt,
      rateLimitKey: `landing-relay:${expert.slug}`,
    });

    const teaser = parseTeaserJson(raw);
    if (teaser) {
      return { teaser, cta };
    }

    const plain = raw.trim().slice(0, TEASER_MAX_CHARS);
    if (plain.length >= 16) {
      return { teaser: plain, cta };
    }
    return null;
  } catch (error) {
    console.warn('[landing-relay] LLM teaser failed', error);
    return null;
  }
}
