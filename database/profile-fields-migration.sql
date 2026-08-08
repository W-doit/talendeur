-- #77: Languages, relocation preference, target organizations
-- Volunteering table already exists (esg-volunteering-schema.sql)

ALTER TABLE public.profile
ADD COLUMN IF NOT EXISTS open_to_relocation BOOLEAN DEFAULT false;

ALTER TABLE public.profile
ADD COLUMN IF NOT EXISTS target_organizations TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.profile.open_to_relocation IS 'Whether the jobseeker is open to relocating';
COMMENT ON COLUMN public.profile.target_organizations IS 'Organizations or sectors the user wants to connect with';

CREATE TABLE IF NOT EXISTS public.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  proficiency TEXT NOT NULL DEFAULT 'Intermediate',
  language_type TEXT NOT NULL DEFAULT 'spoken'
    CHECK (language_type IN ('spoken', 'programming')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_languages_user_id ON public.languages(user_id);

ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own languages" ON public.languages;
CREATE POLICY "Users can view their own languages" ON public.languages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own languages" ON public.languages;
CREATE POLICY "Users can insert their own languages" ON public.languages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own languages" ON public.languages;
CREATE POLICY "Users can update their own languages" ON public.languages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own languages" ON public.languages;
CREATE POLICY "Users can delete their own languages" ON public.languages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public read access to languages" ON public.languages;
CREATE POLICY "Allow public read access to languages" ON public.languages
  FOR SELECT TO anon USING (true);

-- Ensure volunteering is publicly readable for shared profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'volunteering'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow public read access to volunteering" ON public.volunteering';
    EXECUTE 'CREATE POLICY "Allow public read access to volunteering" ON public.volunteering FOR SELECT TO anon USING (true)';
  END IF;
END $$;
