-- Enable public read access for profile sharing feature
-- This allows unauthenticated users to view public profiles via /public/:userId route

-- Allow public SELECT on profile table
CREATE POLICY "Allow public read access to profiles"
ON public.profile
FOR SELECT
TO anon
USING (true);

-- Allow public SELECT on jobseeker_skill_rating
CREATE POLICY "Allow public read access to jobseeker skill ratings"
ON public.jobseeker_skill_rating
FOR SELECT
TO anon
USING (true);

-- Allow public SELECT on organization_details
CREATE POLICY "Allow public read access to organization details"
ON public.organization_details
FOR SELECT
TO anon
USING (true);

-- Allow public SELECT on work_experience
CREATE POLICY "Allow public read access to work experience"
ON public.work_experience
FOR SELECT
TO anon
USING (true);

-- Allow public SELECT on education_history
CREATE POLICY "Allow public read access to education history"
ON public.education_history
FOR SELECT
TO anon
USING (true);

-- Allow public SELECT on education (if exists as singular)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'education') THEN
    EXECUTE 'CREATE POLICY "Allow public read access to education" ON public.education FOR SELECT TO anon USING (true)';
  END IF;
END
$$;

-- Allow public SELECT on certifications
CREATE POLICY "Allow public read access to certifications"
ON public.certifications
FOR SELECT
TO anon
USING (true);

-- Allow public SELECT on reference table
CREATE POLICY "Allow public read access to references"
ON public.reference
FOR SELECT
TO anon
USING (true);

-- Allow public SELECT on skills_dimensions (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'skills_dimensions') THEN
    EXECUTE 'CREATE POLICY "Allow public read access to skills dimensions" ON public.skills_dimensions FOR SELECT TO anon USING (true)';
  END IF;
END
$$;

-- Allow public SELECT on personality_traits (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'personality_traits') THEN
    EXECUTE 'CREATE POLICY "Allow public read access to personality traits" ON public.personality_traits FOR SELECT TO anon USING (true)';
  END IF;
END
$$;

-- Allow public SELECT on personality_facets (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'personality_facets') THEN
    EXECUTE 'CREATE POLICY "Allow public read access to personality facets" ON public.personality_facets FOR SELECT TO anon USING (true)';
  END IF;
END
$$;

-- Allow public SELECT on esg_scores (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'esg_scores') THEN
    EXECUTE 'CREATE POLICY "Allow public read access to ESG scores" ON public.esg_scores FOR SELECT TO anon USING (true)';
  END IF;
END
$$;

-- Allow public SELECT on esg_volunteering (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'esg_volunteering') THEN
    EXECUTE 'CREATE POLICY "Allow public read access to ESG volunteering" ON public.esg_volunteering FOR SELECT TO anon USING (true)';
  END IF;
END
$$;

-- Allow public SELECT on international_experience (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'international_experience') THEN
    EXECUTE 'CREATE POLICY "Allow public read access to international experience" ON public.international_experience FOR SELECT TO anon USING (true)';
  END IF;
END
$$;

-- Note: These policies allow anyone to READ profile data, but NOT modify it
-- Users can still only UPDATE/DELETE their own data through authenticated policies
