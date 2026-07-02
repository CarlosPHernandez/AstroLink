import 'server-only';

import { supabaseAdmin } from '@/lib/supabase';

export const XPRIZE_DECISION_LOG_SCHEMA_VERSION = 't8-v1';

export type XprizeDecisionLogRow = {
  id: string;
  ts: string;
  agent_id: string;
  ref_id: string | null;
  payload: Record<string, unknown> | null;
};

export type XprizeDecisionExport = {
  exported_at: string;
  schema_version: string;
  decision_count: number;
  decisions: Array<{
    id: string;
    ts: string;
    agent_id: string;
    ref_id: string | null;
    operation: string | null;
    provider: string | null;
    model: string | null;
    prompt_hash: string | null;
    output_summary: string | null;
  }>;
};

export async function fetchLlmDecisionLogs(options?: {
  limit?: number;
  since?: string;
}): Promise<XprizeDecisionLogRow[]> {
  const limit = options?.limit ?? 500;

  let query = supabaseAdmin
    .from('audit_log')
    .select('id, ts, agent_id, ref_id, payload')
    .eq('event', 'LLM_DECISION')
    .order('ts', { ascending: false })
    .limit(limit);

  if (options?.since) {
    query = query.gte('ts', options.since);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch LLM decision logs: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    ts: row.ts,
    agent_id: row.agent_id,
    ref_id: row.ref_id,
    payload: (row.payload as Record<string, unknown> | null) ?? null,
  }));
}

export async function fetchRecentAuditLogs(limit = 100) {
  const { data, error } = await supabaseAdmin
    .from('audit_log')
    .select('id, agent_id, event, ref_id, payload, ts')
    .order('ts', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  return data ?? [];
}

export function formatXprizeDecisionExport(rows: XprizeDecisionLogRow[]): XprizeDecisionExport {
  return {
    exported_at: new Date().toISOString(),
    schema_version: XPRIZE_DECISION_LOG_SCHEMA_VERSION,
    decision_count: rows.length,
    decisions: rows.map((row) => {
      const payload = row.payload ?? {};
      return {
        id: row.id,
        ts: row.ts,
        agent_id: row.agent_id,
        ref_id: row.ref_id,
        operation: typeof payload.operation === 'string' ? payload.operation : null,
        provider: typeof payload.provider === 'string' ? payload.provider : null,
        model: typeof payload.model === 'string' ? payload.model : null,
        prompt_hash: typeof payload.prompt_hash === 'string' ? payload.prompt_hash : null,
        output_summary: typeof payload.output_summary === 'string' ? payload.output_summary : null,
      };
    }),
  };
}