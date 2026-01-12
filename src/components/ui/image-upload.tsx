import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X, Loader2 } from 'lucide-react';
import { validateImageFile, compressImage } from '@/lib/supabase-storage';
import ImageCropDialog from '@/components/ui/image-crop-dialog';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (file: File) => void;
  onImageRemove?: () => void;
  uploading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fallbackText?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onImageChange,
  onImageRemove,
  uploading = false,
  size = 'md',
  fallbackText = 'Upload',
  className = ''
}) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-32 w-32',
    lg: 'h-48 w-48'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate the file
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setOriginalFileName(file.name);

    // Create preview URL for cropping
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImageUrl(reader.result as string);
      setShowCropDialog(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      // Compress the cropped image
      const compressedBlob = await compressImage(
        new File([croppedBlob], originalFileName, {
          type: 'image/jpeg',
          lastModified: Date.now()
        })
      );

      const compressedFile = new File([compressedBlob], originalFileName, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);

      // Call the parent's handler
      onImageChange(compressedFile);
      
      // Close the dialog
      setShowCropDialog(false);
      setSelectedImageUrl(null);
    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error('Image processing error:', err);
      setShowCropDialog(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropDialog(false);
    setSelectedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemove?.();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative">
        <Avatar className={`${sizeClasses[size]} cursor-pointer border-2 border-muted hover:border-primary transition-colors`}>
          {preview ? (
            <AvatarImage src={preview} alt="Profile picture" />
          ) : (
            <AvatarFallback onClick={handleClick} className="bg-muted">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </AvatarFallback>
          )}
        </Avatar>
        
        {preview && !uploading && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={uploading}
        >
          {preview ? 'Change Photo' : 'Upload Photo'}
        </Button>
        
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        
        <p className="text-xs text-muted-foreground text-center">
          JPG, PNG, GIF or WebP. Max 5MB.
        </p>
      </div>

      {/* Image Crop Dialog */}
      {selectedImageUrl && (
        <ImageCropDialog
          open={showCropDialog}
          imageUrl={selectedImageUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          circularCrop={true}
        />
      )}
    </div>
  );
};

export default ImageUpload;
