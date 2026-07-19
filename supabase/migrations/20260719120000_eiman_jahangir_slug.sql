-- Eiman Jahangir was listed with a null slug, so profile/relay links fell back to UUID.
-- Canonical public slug matches landing featured expert constant (eiman-jahangir).
UPDATE public.mentors
SET slug = 'eiman-jahangir'
WHERE full_name ILIKE 'Eiman Jahangir%'
  AND (slug IS NULL OR slug = '' OR slug = 'eiman');
