-- Link Supabase Auth users to app profiles and server-controlled roles.

CREATE TABLE IF NOT EXISTS public.user_app_state (
  user_id uuid PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('mentee', 'mentor', 'admin')),
  onboarded boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Server-controlled roles: no client policies; service role + SECURITY DEFINER trigger only.
ALTER TABLE public.user_app_state ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_id uuid UNIQUE;

ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS mentors_user_id_idx ON public.mentors (user_id)
  WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name text;
  app_user_id uuid;
BEGIN
  display_name := coalesce(
    nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(NEW.raw_user_meta_data->>'name'), ''),
    split_part(coalesce(NEW.email, ''), '@', 1)
  );

  IF display_name IS NULL OR display_name = '' THEN
    display_name := 'AstroLink User';
  END IF;

  INSERT INTO public.users (id, email, full_name, auth_id, phone)
  VALUES (
    NEW.id,
    coalesce(NEW.email, ''),
    display_name,
    NEW.id,
    NEW.phone
  )
  ON CONFLICT (email) DO UPDATE
    SET
      auth_id = EXCLUDED.auth_id,
      full_name = CASE
        WHEN public.users.full_name = '' OR public.users.full_name IS NULL
          THEN EXCLUDED.full_name
        ELSE public.users.full_name
      END,
      phone = coalesce(EXCLUDED.phone, public.users.phone)
  RETURNING id INTO app_user_id;

  IF app_user_id IS NULL THEN
    SELECT id INTO app_user_id FROM public.users WHERE auth_id = NEW.id LIMIT 1;
  END IF;

  IF app_user_id IS NOT NULL THEN
    INSERT INTO public.user_app_state (user_id, role, onboarded)
    VALUES (app_user_id, 'mentee', true)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Backfill mentee app state for existing seed user.
INSERT INTO public.user_app_state (user_id, role, onboarded)
SELECT u.id, 'mentee', true
FROM public.users u
WHERE u.email = 'carlos@astrolink.ai'
ON CONFLICT (user_id) DO NOTHING;