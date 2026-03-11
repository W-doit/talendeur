-- Create OG Images Storage Bucket
-- Run this in Supabase SQL Editor or via Supabase Dashboard

-- Create bucket for OG images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('og-images', 'og-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for og-images bucket
-- Allow authenticated users to upload their own OG images
CREATE POLICY "Users can upload their own OG images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'og-images' AND
  (storage.foldername(name))[1] = 'og-images'
);

-- Allow public read access to OG images
CREATE POLICY "OG images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'og-images');

-- Allow users to update their own OG images
CREATE POLICY "Users can update their own OG images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'og-images')
WITH CHECK (bucket_id = 'og-images');

-- Allow users to delete their own OG images
CREATE POLICY "Users can delete their own OG images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'og-images');
