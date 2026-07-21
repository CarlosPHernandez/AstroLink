-- Follow-up: claim tokens created before revoked_at was added need this column.
ALTER TABLE public.mentor_claim_tokens
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
