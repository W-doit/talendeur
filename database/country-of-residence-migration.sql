-- Jobseeker country of residence (default Matches search location)
ALTER TABLE public.profile
ADD COLUMN IF NOT EXISTS country_of_residence text;

COMMENT ON COLUMN public.profile.country_of_residence IS
  'Jobseeker country of residence; used as default Matches location.';
