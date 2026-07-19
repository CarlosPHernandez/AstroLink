import 'server-only';

import { formatEasternTime } from '@/lib/format-eastern-time';
import type { LandingRelayReplySource } from '@/lib/landing/hero-relay';
import { supabaseAdmin } from '@/lib/supabase';

export async function insertLandingGoalSubmission(params: {
  goalText: string;
  expertSlug: string | null;
  expertName: string | null;
  replySource: LandingRelayReplySource;
  ipHash: string | null;
  userAgent: string | null;
  userId?: string | null;
}): Promise<string | null> {
  const estTime = formatEasternTime(new Date());

  const { data, error } = await supabaseAdmin
    .from('landing_goal_submissions')
    .insert({
      goal_text: params.goalText,
      expert_slug: params.expertSlug,
      expert_name: params.expertName,
      reply_source: params.replySource,
      ip_hash: params.ipHash,
      user_agent: params.userAgent,
      user_id: params.userId ?? null,
      est_time: estTime,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[landing-relay] failed to persist goal submission', error.message);
    return null;
  }

  return data?.id ?? null;
}
