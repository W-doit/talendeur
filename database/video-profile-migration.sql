-- Add video_url field to profile table for 2-minute profile video
-- This field stores a URL to a hosted video (YouTube, Vimeo, etc.)

ALTER TABLE public.profile
ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN public.profile.video_url IS 'URL to profile video (max 2 minutes recommended)';
