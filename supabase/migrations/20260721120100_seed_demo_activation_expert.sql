-- Demo expert for activation dry-run (not Chris). Ops invites a real inbox to claim.
INSERT INTO public.mentors (
  id,
  email,
  full_name,
  slug,
  title,
  employer,
  expertise,
  bio,
  live_session_price_cents,
  compliance_status,
  is_listed,
  stripe_onboarding_completed,
  activation_status
)
VALUES (
  'a0000005-0000-4000-8000-000000000005',
  'demo-activation@astrolink.ai',
  'Demo Activation Expert',
  'demo-activation-expert',
  'Activation Test Mentor',
  'AstroLink',
  ARRAY['Session Ops', 'Onboarding'],
  'Pre-seeded mentor used to dry-run the claim + activation wizard before inviting real experts.',
  0,
  'approved',
  false,
  false,
  'pending'
)
ON CONFLICT (email) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  slug = EXCLUDED.slug,
  activation_status = 'pending',
  is_listed = false;
