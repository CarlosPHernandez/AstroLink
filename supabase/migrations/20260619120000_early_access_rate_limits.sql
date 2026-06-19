-- Cross-instance rate limit buckets for POST /api/early-access (service role only).

CREATE TABLE public.early_access_rate_limits (
  bucket_key text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  hit_count integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX early_access_rate_limits_updated_at_idx
  ON public.early_access_rate_limits (updated_at);

ALTER TABLE public.early_access_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.early_access_consume_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_hit_count integer;
  v_retry_after_seconds integer;
BEGIN
  IF p_limit < 1 OR p_window_seconds < 1 THEN
    RETURN jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
  END IF;

  SELECT window_start, hit_count
  INTO v_window_start, v_hit_count
  FROM public.early_access_rate_limits
  WHERE bucket_key = p_bucket_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.early_access_rate_limits (bucket_key, window_start, hit_count)
    VALUES (p_bucket_key, v_now, 1);
    RETURN jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
  END IF;

  IF v_now >= v_window_start + make_interval(secs => p_window_seconds) THEN
    UPDATE public.early_access_rate_limits
    SET window_start = v_now, hit_count = 1, updated_at = v_now
    WHERE bucket_key = p_bucket_key;
    RETURN jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
  END IF;

  IF v_hit_count >= p_limit THEN
    v_retry_after_seconds := GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM (v_window_start + make_interval(secs => p_window_seconds) - v_now)))::integer
    );
    RETURN jsonb_build_object('allowed', false, 'retry_after_seconds', v_retry_after_seconds);
  END IF;

  UPDATE public.early_access_rate_limits
  SET hit_count = v_hit_count + 1, updated_at = v_now
  WHERE bucket_key = p_bucket_key;

  RETURN jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.early_access_consume_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.early_access_consume_rate_limit(text, integer, integer) TO service_role;