-- Migration to update reference table with new fields
-- Drop old fields and add new ones

ALTER TABLE reference
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS number;

ALTER TABLE reference
ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS nature_of_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS year_worked_known VARCHAR(50),
ADD COLUMN IF NOT EXISTS linkedin_profile VARCHAR(255);

-- Add constraint to validate LinkedIn URL format (optional)
ALTER TABLE reference
ADD CONSTRAINT linkedin_url_format CHECK (
  linkedin_profile IS NULL OR 
  linkedin_profile ~* '^https?://(www\.)?linkedin\.com/.*'
);
