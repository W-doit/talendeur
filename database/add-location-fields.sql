-- Add location field to work_experience table
ALTER TABLE public.work_experience ADD COLUMN location TEXT;

-- Add location field to education_history table
ALTER TABLE public.education_history ADD COLUMN location TEXT;

