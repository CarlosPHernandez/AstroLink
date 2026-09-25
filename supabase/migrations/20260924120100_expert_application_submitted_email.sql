CREATE UNIQUE INDEX expert_applications_one_submitted_email
  ON public.expert_applications (email)
  WHERE status = 'submitted';
