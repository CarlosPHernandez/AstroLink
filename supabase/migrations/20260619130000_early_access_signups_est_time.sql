-- Human-readable Eastern Time for ops canvases and Slack briefs.

ALTER TABLE public.early_access_signups
  ADD COLUMN IF NOT EXISTS est_time text;

UPDATE public.early_access_signups
SET est_time = to_char(
  timezone('America/New_York', created_at),
  'TMMon DD, YYYY "at" HH12:MI AM'
) || ' ET'
WHERE est_time IS NULL;

ALTER TABLE public.early_access_signups
  ALTER COLUMN est_time SET NOT NULL;