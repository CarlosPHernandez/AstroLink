-- Atomic publish: serialize per mentor, enforce max published cap in one statement.
-- Prevents two parallel publishes both observing count = 4 and both succeeding.

CREATE OR REPLACE FUNCTION public.publish_expert_offer(
  p_offer_id uuid,
  p_mentor_id uuid,
  p_now timestamptz,
  p_cap integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated public.expert_offers;
  cur_status public.expert_offer_status;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtext('publish_expert_offer'),
    hashtext(p_mentor_id::text)
  );

  UPDATE public.expert_offers o
  SET
    status = 'published',
    published_at = COALESCE(o.published_at, p_now),
    unpublished_at = NULL,
    archived_at = NULL,
    updated_at = p_now
  WHERE o.id = p_offer_id
    AND o.mentor_id = p_mentor_id
    AND o.status IN ('draft', 'unpublished')
    AND (
      SELECT count(*)::integer
      FROM public.expert_offers p
      WHERE p.mentor_id = p_mentor_id
        AND p.status = 'published'
        AND p.id <> p_offer_id
    ) < p_cap
  RETURNING o.* INTO updated;

  IF updated IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'offer', to_jsonb(updated));
  END IF;

  SELECT o.status INTO cur_status
  FROM public.expert_offers o
  WHERE o.id = p_offer_id
    AND o.mentor_id = p_mentor_id;

  IF cur_status IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF cur_status NOT IN ('draft', 'unpublished') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_status');
  END IF;

  RETURN jsonb_build_object('ok', false, 'error', 'cap');
END;
$$;

REVOKE ALL ON FUNCTION public.publish_expert_offer(uuid, uuid, timestamptz, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_expert_offer(uuid, uuid, timestamptz, integer) TO service_role;
