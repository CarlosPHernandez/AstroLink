-- Expert portraits in the same per-slug folder as intro videos:
--   expert-intro-videos/<slug>/portrait.jpg
--
-- UPDATE public.mentors
-- SET image_url = 'https://<project-ref>.supabase.co/storage/v1/object/public/expert-intro-videos/<slug>/portrait.jpg'
-- WHERE slug = '<slug>';

UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
WHERE id = 'expert-intro-videos';

COMMENT ON COLUMN public.mentors.image_url IS
  'Public URL for expert portrait (Storage expert-intro-videos/<slug>/portrait.* or legacy /public path).';
