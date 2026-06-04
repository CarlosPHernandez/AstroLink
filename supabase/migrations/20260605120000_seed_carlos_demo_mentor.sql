-- Demo mentor for dual-device video tests (Carlos as mentor on laptop).
-- Auth preset: carlosphernandez2020@gmail.com → id a0000004-...

INSERT INTO public.mentors (
  id,
  email,
  full_name,
  slug,
  title,
  employer,
  expertise,
  bio,
  image_url,
  live_session_price_cents,
  compliance_status,
  is_listed,
  stripe_onboarding_completed
)
VALUES (
  'a0000004-0000-4000-8000-000000000004',
  'carlosphernandez2020@gmail.com',
  'Carlos Hernandez',
  'carlos-hernandez',
  'Aerospace Systems & Demo Expert',
  'AstroLink',
  ARRAY['Systems Engineering', 'Demo Operations', 'Mentorship'],
  'Demo mentor profile for live session walkthroughs. Book from carlos@astrolink.ai (mentee) and join as mentor from a second device.',
  '/chris_sembroski.jpeg',
  25000,
  'approved',
  true,
  false
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  employer = EXCLUDED.employer,
  expertise = EXCLUDED.expertise,
  bio = EXCLUDED.bio,
  live_session_price_cents = EXCLUDED.live_session_price_cents,
  compliance_status = EXCLUDED.compliance_status,
  is_listed = EXCLUDED.is_listed;
