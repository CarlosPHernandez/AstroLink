import 'server-only';

import { createHash } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { EarlyAccessRateLimitError } from '@/lib/waitlist/early-access-rate-limit';

type RateLimitWindow = {
  label: string;
  limit: number;
  windowSeconds: number;
};

type ConsumeResult = {
  allowed: boolean;
  retry_after_seconds?: number;
};

function hashKey(prefix: string, value: string): string {
  const digest = createHash('sha256').update(value).digest('hex').slice(0, 32);
  return `${prefix}:${digest}`;
}

async function consumeBucket(
  bucketKey: string,
  window: RateLimitWindow,
): Promise<{ allowed: true } | { allowed: false; retryAfterMs: number }> {
  const { data, error } = await supabaseAdmin.rpc('early_access_consume_rate_limit', {
    p_bucket_key: bucketKey,
    p_limit: window.limit,
    p_window_seconds: window.windowSeconds,
  });

  if (error) {
    throw error;
  }

  const result = data as ConsumeResult | null;
  if (!result?.allowed) {
    const retryAfterSeconds = Math.max(1, result?.retry_after_seconds ?? 1);
    return { allowed: false, retryAfterMs: retryAfterSeconds * 1000 };
  }

  return { allowed: true };
}

export async function assertEarlyAccessDurableRateLimits(options: {
  clientKey: string;
  email?: string;
  ipWindows: RateLimitWindow[];
  emailWindows: RateLimitWindow[];
}): Promise<void> {
  const { clientKey, email, ipWindows, emailWindows } = options;

  for (const window of ipWindows) {
    const bucketKey = hashKey(`ip:${window.label}`, clientKey);
    const result = await consumeBucket(bucketKey, window);
    if (!result.allowed) {
      throw new EarlyAccessRateLimitError(
        `Too many signup attempts. Try again in ${Math.ceil(result.retryAfterMs / 1000)} seconds.`,
        result.retryAfterMs,
      );
    }
  }

  if (email) {
    for (const window of emailWindows) {
      const bucketKey = hashKey(`email:${window.label}`, email.toLowerCase());
      const result = await consumeBucket(bucketKey, window);
      if (!result.allowed) {
        throw new EarlyAccessRateLimitError(
          `Too many signup attempts for this email. Try again in ${Math.ceil(result.retryAfterMs / 1000)} seconds.`,
          result.retryAfterMs,
        );
      }
    }
  }
}