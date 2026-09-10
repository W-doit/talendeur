-- Persist profile recommendations (gap analysis + career foresight) on the jobseeker profile
ALTER TABLE public.profile
ADD COLUMN IF NOT EXISTS gap_analysis_result JSONB,
ADD COLUMN IF NOT EXISTS career_foresight_result JSONB;

COMMENT ON COLUMN public.profile.gap_analysis_result IS
  'Cached target-role gap analysis result for the jobseeker.';

COMMENT ON COLUMN public.profile.career_foresight_result IS
  'Cached stay-ahead / career foresight result for the jobseeker.';
