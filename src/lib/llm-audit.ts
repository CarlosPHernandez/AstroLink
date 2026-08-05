import 'server-only';

import { createHash } from 'node:crypto';
import type { Json } from '@/lib/database.types';
import { supabaseAdmin } from '@/lib/supabase';

export type LlmAuditAgentId = 'APX-01' | 'APX-02' | 'APX-03' | 'APX-04' | 'APX-06' | 'APX-09';

export type LlmAuditContext = {
  agentId: LlmAuditAgentId;
  operation: string;
  refId?: string | null;
};

export type LlmAuditProvider = 'openai' | 'gemini';

export type LlmUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostCents?: number; // rough, for internal logging / revenue attribution
};

/** SHA-256 of system instruction + user prompt — stable id for XPRIZE evidence without storing PII. */
export function hashLlmPrompt(systemInstruction: string, prompt: string): string {
  return createHash('sha256').update(`${systemInstruction}\n---\n${prompt}`, 'utf8').digest('hex');
}

/** One-line summary for judges; prefers structured fields when present. */
export function summarizeLlmOutput(output: unknown): string {
  if (typeof output === 'string') {
    return truncate(output, 280);
  }

  if (output && typeof output === 'object') {
    const obj = output as Record<string, unknown>;
    if (typeof obj.one_line_summary === 'string') {
      return truncate(obj.one_line_summary, 280);
    }
    if (typeof obj.session_summary === 'string') {
      return truncate(obj.session_summary, 280);
    }
    if (typeof obj.match_reason === 'string') {
      return truncate(obj.match_reason, 280);
    }
    if (typeof obj.reasoning === 'string') {
      return truncate(obj.reasoning, 280);
    }
    if (typeof obj.mentor_id === 'string') {
      return `match mentor_id=${obj.mentor_id}`;
    }
    return truncate(JSON.stringify(output), 280);
  }

  return truncate(String(output), 280);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 3)}...`;
}

/** Persists structured Gemini/OpenAI decision metadata for XPRIZE T8 export.
 *  Usage is logged for internal cost tracking / platform revenue attribution.
 */
export async function logLlmDecision(params: {
  context: LlmAuditContext;
  provider: LlmAuditProvider;
  model: string;
  promptHash: string;
  outputSummary: string;
  usage?: LlmUsage;
}): Promise<void> {
  const payload: Record<string, unknown> = {
    operation: params.context.operation,
    provider: params.provider,
    model: params.model,
    prompt_hash: params.promptHash,
    output_summary: params.outputSummary,
  };

  if (params.usage) {
    payload.usage = params.usage;
  }

  const { error } = await supabaseAdmin.from('audit_log').insert({
    agent_id: params.context.agentId,
    event: 'LLM_DECISION',
    ref_id: params.context.refId ?? null,
    payload: payload as Json,
  });

  if (error) {
    throw new Error(`LLM audit log insert failed: ${error.message}`);
  }
}