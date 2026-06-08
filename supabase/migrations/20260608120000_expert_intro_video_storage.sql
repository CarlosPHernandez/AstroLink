-- Expert intro video hosting via Supabase Storage
--
-- mentors.intro_video_url (existing column) stores the public object URL, e.g.:
--   https://<project-ref>.supabase.co/storage/v1/object/public/expert-intro-videos/<slug>/intro.mp4
--
-- Object layout (one folder per expert slug):
--   expert-intro-videos/<slug>/intro.mp4
--
-- Upload after applying this migration (Dashboard or service-role CLI):
--   supabase storage cp ./intro.mp4 ss:///expert-intro-videos/chris-sembroski/intro.mp4 --experimental
--
-- Then wire the mentor row:
--   UPDATE public.mentors
--   SET intro_video_url = 'https://<project-ref>.supabase.co/storage/v1/object/public/expert-intro-videos/<slug>/intro.mp4'
--   WHERE slug = '<slug>';
--
-- App code (ExpertIntroMedia) accepts full HTTPS URLs or legacy /public paths — no code change required.

-- ---------------------------------------------------------------------------
-- Bucket
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expert-intro-videos',
  'expert-intro-videos',
  true,
  104857600, -- 100 MiB per file
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Storage policies
-- ---------------------------------------------------------------------------

-- Public read for profile pages and landing (anonymous visitors).
CREATE POLICY expert_intro_videos_public_read ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'expert-intro-videos');

-- Writes: use service role (API scripts, Dashboard with service key).
-- Mentor self-serve upload policies deferred until Supabase Auth backs mentor login.

COMMENT ON COLUMN public.mentors.intro_video_url IS
  'Public URL for expert intro video (Supabase Storage expert-intro-videos/<slug>/intro.* or legacy /public path).';
