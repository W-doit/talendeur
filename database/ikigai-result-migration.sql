-- Persist Find your ikigai result on the jobseeker profile
ALTER TABLE public.profile
ADD COLUMN IF NOT EXISTS ikigai_result JSONB;

COMMENT ON COLUMN public.profile.ikigai_result IS
  'Saved Find your ikigai questionnaire result for the jobseeker.';
