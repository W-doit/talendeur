-- Add og_image_url column to profile table
ALTER TABLE public.profile
ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Add comment
COMMENT ON COLUMN public.profile.og_image_url IS 'URL of the Open Graph image for social media sharing (dashboard preview)';
