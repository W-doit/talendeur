-- Saved external job openings for jobseekers (Matches tab)
CREATE TABLE IF NOT EXISTS public.saved_job_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id text NOT NULL,
  title text NOT NULL,
  company text,
  location text,
  url text NOT NULL,
  description_snippet text,
  source text,
  score integer,
  why_fit text,
  gaps text[] DEFAULT '{}',
  saved_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_job_matches_user_job_unique UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS saved_job_matches_user_id_saved_at_idx
  ON public.saved_job_matches (user_id, saved_at DESC);

ALTER TABLE public.saved_job_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saved job matches" ON public.saved_job_matches;
CREATE POLICY "Users can view their own saved job matches"
  ON public.saved_job_matches FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own saved job matches" ON public.saved_job_matches;
CREATE POLICY "Users can insert their own saved job matches"
  ON public.saved_job_matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved job matches" ON public.saved_job_matches;
CREATE POLICY "Users can delete their own saved job matches"
  ON public.saved_job_matches FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own saved job matches" ON public.saved_job_matches;
CREATE POLICY "Users can update their own saved job matches"
  ON public.saved_job_matches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.saved_job_matches IS
  'Job openings a jobseeker has saved from the Matches tab for later access.';
