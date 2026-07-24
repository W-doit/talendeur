-- Add portfolio_url field to profile table
-- Stores a link to portfolio, GitHub, Behance, or personal website

ALTER TABLE public.profile
ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

COMMENT ON COLUMN public.profile.portfolio_url IS 'URL to portfolio, GitHub, Behance, or personal website';
