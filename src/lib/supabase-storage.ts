import { supabase } from '@/integrations/supabase/client';

// Storage bucket name for profile pictures
export const PROFILE_PICTURES_BUCKET = 'profile-pictures';
export const CV_BUCKET = 'cvs';

/**
 * Upload a CV (PDF) to Supabase Storage
 * @param file - The PDF file to upload
 * @param userId - The user's ID (used for file naming)
 * @returns The public URL of the uploaded CV
 */
export async function uploadCV(file: File, userId: string): Promise<string> {
  try {
    // Validate file type
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('CV file size must be less than 10MB');
    }

    // Use a consistent filename with timestamp to track versions
    const fileName = `cv-${Date.now()}.pdf`;
    const filePath = `${userId}/${fileName}`;

    // First, delete all old CV files for this user to avoid clutter
    try {
      const { data: existingFiles } = await supabase.storage
        .from(CV_BUCKET)
        .list(userId);
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
        await supabase.storage
          .from(CV_BUCKET)
          .remove(filesToDelete);
        console.log('Deleted old CV files:', filesToDelete);
      }
    } catch (deleteError) {
      console.warn('Could not delete old CV files:', deleteError);
      // Continue with upload even if deletion fails
    }

    // Upload the new file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(CV_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('CV upload error:', error);
      throw new Error(`Failed to upload CV: ${error.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(CV_BUCKET)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading CV:', error);
    throw error;
  }
}

/**
 * Upload a profile picture to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The user's ID (used for file naming)
 * @returns The public URL of the uploaded image
 */
export async function uploadProfilePicture(file: File, userId: string): Promise<string> {
  try {
    console.log('Starting profile picture upload...');
    console.log('File details:', { name: file.name, size: file.size, type: file.type });
    console.log('User ID:', userId);
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    console.log('Upload path:', filePath);
    console.log('Bucket name:', PROFILE_PICTURES_BUCKET);
    console.log('About to call storage.upload...');

    // Create upload promise with explicit timeout
    const uploadPromise = supabase.storage
      .from(PROFILE_PICTURES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.error('Upload timed out after 10 seconds');
        reject(new Error('Upload timeout - check your Supabase storage bucket permissions and CORS settings'));
      }, 10000);
    });
    
    // Race between upload and timeout
    const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);
    
    console.log('Upload call completed');

    if (error) {
      console.error('Upload error details:', error);
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    
    console.log('Upload successful, data:', data);

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(PROFILE_PICTURES_BUCKET)
      .getPublicUrl(filePath);
    
    console.log('Public URL generated:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
}

/**
 * Delete a profile picture from Supabase Storage
 * @param imageUrl - The URL of the image to delete
 */
export async function deleteProfilePicture(imageUrl: string): Promise<void> {
  try {
    // Extract the file path from the URL
    const urlParts = imageUrl.split(`${PROFILE_PICTURES_BUCKET}/`);
    if (urlParts.length < 2) {
      throw new Error('Invalid image URL');
    }
    
    const filePath = urlParts[1].split('?')[0]; // Remove query parameters

    const { error } = await supabase.storage
      .from(PROFILE_PICTURES_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw error;
  }
}

/**
 * Validate image file
 * @param file - The file to validate
 * @returns Error message if invalid, null if valid
 */
export function validateImageFile(file: File): string | null {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)';
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return 'Image size must be less than 5MB';
  }

  return null;
}

/**
 * Compress and resize image before upload
 * @param file - The original image file
 * @param maxWidth - Maximum width in pixels (default: 800)
 * @param maxHeight - Maximum height in pixels (default: 800)
 * @param quality - Image quality 0-1 (default: 0.8)
 * @returns Compressed image as a Blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
}
