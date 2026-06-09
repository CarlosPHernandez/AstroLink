-- Mentee self-serve accounts: link public.users to Supabase Auth identities.

CREATE POLICY users_select_own ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
