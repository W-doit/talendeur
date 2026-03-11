import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

/**
 * Capture a screenshot of a DOM element and convert to File
 */
export async function captureElementScreenshot(
  element: HTMLElement,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): Promise<File> {
  const { width = 1200, height = 630, quality = 0.95 } = options || {};

  // Capture the element
  const canvas = await html2canvas(element, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    scale: 2, // Higher resolution
    width,
    height,
    windowWidth: width,
    windowHeight: height,
  });

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create image blob'));
          return;
        }
        
        // Convert blob to File
        const file = new File([blob], 'dashboard-preview.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        resolve(file);
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Upload dashboard preview image to Supabase storage
 */
export async function uploadDashboardPreview(
  file: File,
  userId: string
): Promise<string> {
  const fileName = `${userId}-dashboard-preview-${Date.now()}.jpg`;
  const filePath = `og-images/${fileName}`;

  // Upload to Supabase storage (create bucket 'og-images' if doesn't exist)
  const { data, error } = await supabase.storage
    .from('og-images')
    .upload(filePath, file, {
      contentType: 'image/jpeg',
      upsert: true, // Replace if exists
    });

  if (error) {
    console.error('Error uploading dashboard preview:', error);
    throw new Error(`Failed to upload preview: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('og-images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Save OG image URL to user profile
 */
export async function saveOGImageToProfile(
  userId: string,
  imageUrl: string
): Promise<void> {
  const { error } = await supabase
    .from('profile')
    .update({ og_image_url: imageUrl })
    .eq('user_id', userId);

  if (error) {
    console.error('Error saving OG image URL:', error);
    throw new Error(`Failed to save OG image: ${error.message}`);
  }
}

/**
 * Complete workflow: Capture dashboard, upload, and save to profile
 */
export async function generateDashboardPreview(
  dashboardElement: HTMLElement,
  userId: string
): Promise<string> {
  // Capture screenshot
  const imageFile = await captureElementScreenshot(dashboardElement, {
    width: 1200,
    height: 630,
  });

  // Upload to storage
  const imageUrl = await uploadDashboardPreview(imageFile, userId);

  // Save URL to profile
  await saveOGImageToProfile(userId, imageUrl);

  return imageUrl;
}
