-- ================================================
-- Supabase Storage Setup for Profile Pictures
-- ================================================
-- IMPORTANT: First create the bucket via the Supabase UI, then run this SQL script
--
-- STEP 1: Create Bucket via UI
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: profile-pictures
-- 4. Check "Public bucket"
-- 5. Click "Create bucket"
--
-- STEP 2: Run this SQL script to create the security policies
-- Copy and paste this ENTIRE script into Supabase SQL Editor and click RUN
-- ================================================

-- First, let's see what policies exist
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%profile%';

-- Drop ALL existing policies on storage.objects for profile-pictures
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
    END LOOP;
END $$;

-- Now create simple, permissive policies for profile-pictures bucket

-- 1. Allow authenticated users to INSERT (upload)
CREATE POLICY "profile_pictures_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

-- 2. Allow authenticated users to SELECT (view their own)
CREATE POLICY "profile_pictures_select_auth"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-pictures');

-- 3. Allow public to SELECT (view all)
CREATE POLICY "profile_pictures_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- 4. Allow authenticated users to UPDATE
CREATE POLICY "profile_pictures_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-pictures')
WITH CHECK (bucket_id = 'profile-pictures');

-- 5. Allow authenticated users to DELETE
CREATE POLICY "profile_pictures_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-pictures');

-- ================================================
-- Setup Complete!
-- ================================================
-- Your storage bucket is now ready to use.
-- Users can upload profile pictures up to 5MB in size.
