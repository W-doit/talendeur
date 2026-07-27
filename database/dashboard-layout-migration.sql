-- Persist jobseeker dashboard section order + visibility for public profile
ALTER TABLE public.profile
ADD COLUMN IF NOT EXISTS dashboard_layout JSONB;

COMMENT ON COLUMN public.profile.dashboard_layout IS
  'Jobseeker dashboard layout: array of {id, visible, order, column}';
