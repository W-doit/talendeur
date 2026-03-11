-- Organization Profile Migration
-- This creates a separate table for multiple contact persons per organization

-- Create organization_contacts table for multiple contact persons per organization
CREATE TABLE IF NOT EXISTS public.organization_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organization_details(organization_id) ON DELETE CASCADE,
  contact_name VARCHAR(100) NOT NULL,
  contact_email VARCHAR(100) NOT NULL,
  contact_role VARCHAR(100) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT contact_email_valid CHECK (
    contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- Add comments for documentation
COMMENT ON TABLE public.organization_contacts IS 'Contact persons for organizations (one-to-many relationship)';
COMMENT ON COLUMN public.organization_contacts.contact_name IS 'Full name of the contact person';
COMMENT ON COLUMN public.organization_contacts.contact_email IS 'Email address of the contact person';
COMMENT ON COLUMN public.organization_contacts.contact_role IS 'Job title/role of the contact person';
COMMENT ON COLUMN public.organization_contacts.is_primary IS 'Whether this is the primary contact for the organization';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_contacts_org_id ON public.organization_contacts(organization_id);

-- RLS Policies for organization_contacts table
ALTER TABLE public.organization_contacts ENABLE ROW LEVEL SECURITY;

-- Policy for selecting organization contacts (organizations can view their own, public can view all)
CREATE POLICY "Anyone can view organization contacts"
ON public.organization_contacts FOR SELECT
TO public
USING (true);

-- Policy for inserting organization contacts
CREATE POLICY "Organizations can insert their own contacts"
ON public.organization_contacts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = organization_id);

-- Policy for updating organization contacts
CREATE POLICY "Organizations can update their own contacts"
ON public.organization_contacts FOR UPDATE
TO authenticated
USING (auth.uid() = organization_id)
WITH CHECK (auth.uid() = organization_id);

-- Policy for deleting organization contacts
CREATE POLICY "Organizations can delete their own contacts"
ON public.organization_contacts FOR DELETE
TO authenticated
USING (auth.uid() = organization_id);

-- Update RLS policies for organization_details (ensure they exist)
ALTER TABLE public.organization_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organizations can view their own details" ON public.organization_details;
CREATE POLICY "Organizations can view their own details"
ON public.organization_details FOR SELECT
TO authenticated
USING (auth.uid() = organization_id);

DROP POLICY IF EXISTS "Organizations can insert their own details" ON public.organization_details;
CREATE POLICY "Organizations can insert their own details"
ON public.organization_details FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = organization_id);

DROP POLICY IF EXISTS "Organizations can update their own details" ON public.organization_details;
CREATE POLICY "Organizations can update their own details"
ON public.organization_details FOR UPDATE
TO authenticated
USING (auth.uid() = organization_id)
WITH CHECK (auth.uid() = organization_id);

DROP POLICY IF EXISTS "Organizations can delete their own details" ON public.organization_details;
CREATE POLICY "Organizations can delete their own details"
ON public.organization_details FOR DELETE
TO authenticated
USING (auth.uid() = organization_id);
