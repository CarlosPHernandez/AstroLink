-- Dev seed for D1 golden-path testing (replace Stripe IDs after Connect onboarding)

INSERT INTO public.users (id, email, full_name)
VALUES (
  'a0000001-0000-4000-8000-000000000001',
  'carlos@astrolink.ai',
  'Carlos Hernandez'
)
ON CONFLICT (email) DO NOTHING;

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
  'a0000002-0000-4000-8000-000000000002',
  'chris@astrolink.ai',
  'Chris Sembroski',
  'chris-sembroski',
  'Inspiration4 Astronaut & Aerospace Engineer',
  'Inspiration4 / Lockheed Martin / Starfish Space',
  ARRAY['Commercial Spaceflight', 'Payload Integration', 'Flight Mechanics'],
  'Commercial astronaut who flew on Inspiration4. Expert in payload integration and flight mechanics for private astronaut operations.',
  '/chris_sembroski.jpeg',
  32000,
  'approved',
  true,
  false
)
ON CONFLICT (email) DO NOTHING;
