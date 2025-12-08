# Supabase Storage Setup for Profile Pictures

## 1. Create Storage Bucket

In your Supabase dashboard:

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Set the following:
   - **Name**: `profile-pictures`
   - **Public bucket**: ✅ **Enable** (so images are publicly accessible)
   - **File size limit**: 5242880 (5MB)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/gif,image/webp`

4. Click **Create bucket**

## 2. Set Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies:

### Policy 1: Allow authenticated users to upload their own images

```sql
-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 2: Allow authenticated users to update their own images

```sql
-- Allow authenticated users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3: Allow authenticated users to delete their own images

```sql
-- Allow authenticated users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 4: Allow public read access (since it's a public bucket)

```sql
-- Allow anyone to view profile pictures (public access)
CREATE POLICY "Public profile pictures are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');
```

## 3. Apply Policies via Supabase Dashboard

1. In your Supabase dashboard, go to **Storage** → **Policies**
2. Select the `profile-pictures` bucket
3. Click **New policy**
4. For each policy above:
   - Choose the appropriate operation (SELECT, INSERT, UPDATE, DELETE)
   - Set the target role (authenticated or public)
   - Add the policy definition
   - Click **Review** and then **Save policy**

## 4. Verify Setup

After setting up the bucket and policies:

1. Test uploading an image through your app
2. Check the Storage section in Supabase to see if the image appears
3. Verify the public URL works by copying it and opening in a new tab

## File Structure

Images will be stored in this structure:
```
profile-pictures/
  ├── {user-id-1}/
  │   ├── {user-id-1}-{timestamp-1}.jpg
  │   └── {user-id-1}-{timestamp-2}.png
  ├── {user-id-2}/
  │   └── {user-id-2}-{timestamp-1}.jpg
  └── ...
```

## Features Implemented

✅ **Image Upload**: Users can upload profile pictures (job seekers) and logos (organizations)
✅ **Image Preview**: Real-time preview before and after upload
✅ **Compression**: Images are automatically compressed to reduce storage
✅ **Validation**: File type and size validation (max 5MB)
✅ **Security**: Users can only upload/modify/delete their own images
✅ **Public Access**: Profile pictures are publicly accessible for display

## Troubleshooting

### If upload fails:
1. Check browser console for errors
2. Verify the bucket exists and is public
3. Ensure RLS policies are correctly applied
4. Check that your `.env` file has the correct Supabase credentials

### If images don't display:
1. Verify the bucket is set to **public**
2. Check the public URL format is correct
3. Ensure the SELECT policy allows public access

## Alternative: Quick Setup via SQL

You can also run all policies at once in the SQL Editor:

```sql
-- Enable RLS on storage.objects (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create all policies
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public profile pictures are viewable by everyone"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile-pictures');
```
