
import React, { useState } from 'react';
import { useAuth, JobSeekerProfile } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ImageUpload from '@/components/ui/image-upload';
import { LinkedInImport } from '@/components/profile/LinkedInImport';
import { uploadProfilePicture } from '@/lib/supabase-storage';
import { ParsedData } from '@/lib/pdf-parser';
import { useToast } from '@/components/ui/use-toast';

interface JobSeekerProfileFormProps {
  onSaveComplete?: () => void;
  importedData?: { parsedData: any; pdfFile: File } | null;
  onDataImport?: (data: any) => void;
}

const JobSeekerProfileForm: React.FC<JobSeekerProfileFormProps> = ({ 
  onSaveComplete,
  importedData,
  onDataImport 
}) => {
  const { user, updateProfile } = useAuth();
  const profile = user?.profile as JobSeekerProfile | null;
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Partial<JobSeekerProfile>>({
    name: profile?.name || '',
    headline: (profile as any)?.headline || '',
    bio: profile?.bio || '',
    profilePic: profile?.profilePic || '',
    cv: profile?.cv || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);

  // Restore imported data when coming back to this tab
  React.useEffect(() => {
    if (importedData) {
      const { parsedData, pdfFile } = importedData;
      setCvFile(pdfFile);
      
      const fullName = `${parsedData.profile.firstName || ''} ${parsedData.profile.surname || ''}`.trim();
      setFormData(prev => ({
        ...prev,
        name: fullName || prev.name,
        headline: parsedData.profile.headline || prev.headline,
        bio: parsedData.profile.bio || prev.bio,
        email: parsedData.profile.email || prev.email,
      }));
    }
  }, [importedData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillChange = (skill: keyof JobSeekerProfile['skills'], value: number) => {
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills!,
        [skill]: value
      }
    }));
  };

  const handleCVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setCvFile(file);
    } else {
      alert('Please upload a PDF file');
    }
  };

  const handleCVRemove = () => {
    setCvFile(null);
    setFormData(prev => ({
      ...prev,
      cv: ''
    }));
  };

  const handleImageChange = (file: File) => {
    setImageFile(file);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setFormData(prev => ({
      ...prev,
      profilePic: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    console.log('Current formData:', formData);
    console.log('imageFile:', imageFile);
    console.log('cvFile:', cvFile);
    
    setIsSubmitting(true);
    
    try {
      let profilePicUrl = formData.profilePic;
      let cvUrl = formData.cv;

      // Upload image if a new one was selected
      if (imageFile && user?.id) {
        console.log('Uploading image...');
        setUploadingImage(true);
        try {
          profilePicUrl = await uploadProfilePicture(imageFile, user.id);
          console.log('Image uploaded successfully:', profilePicUrl);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          throw new Error('Failed to upload profile picture');
        } finally {
          setUploadingImage(false);
        }
      }

      // Upload CV if a new one was selected
      if (cvFile && user?.id) {
        console.log('Uploading CV...', cvFile);
        setUploadingCV(true);
        try {
          // Import uploadCV function
          const { uploadCV } = await import('@/lib/supabase-storage');
          cvUrl = await uploadCV(cvFile, user.id);
          console.log('CV uploaded successfully:', cvUrl);
        } catch (uploadError) {
          console.error('CV upload error:', uploadError);
          throw new Error('Failed to upload CV');
        } finally {
          setUploadingCV(false);
        }
      }

      console.log('Calling updateProfile with:', {
        ...formData,
        profilePic: profilePicUrl,
        cv: cvUrl
      });

      // Update profile with the image and CV URLs
      await updateProfile({
        ...formData,
        profilePic: profilePicUrl,
        cv: cvUrl
      });

      console.log('Profile updated successfully');

      setImageFile(null);
      setCvFile(null);
      
      // Call the onSaveComplete callback if provided
      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkedInImport = (data: ParsedData, pdfFile: File) => {
    // Store data in parent component to persist across tab changes
    if (onDataImport) {
      onDataImport({ parsedData: data, pdfFile });
    }
    
    // Store the PDF file to be uploaded
    setCvFile(pdfFile);
    
    // Pre-fill profile information - combine all updates in one setState call
    const fullName = `${data.profile.firstName || ''} ${data.profile.surname || ''}`.trim();
    
    setFormData(prev => ({
      ...prev,
      name: fullName || prev.name,
      headline: data.profile.headline || prev.headline,
      bio: data.profile.bio || prev.bio,
      email: data.profile.email || prev.email,
    }));

    // Show success message with details
    const extractedItems = [];
    if (data.profile.firstName) extractedItems.push('name');
    if (data.profile.bio) extractedItems.push('bio');
    if (data.education.length > 0) extractedItems.push(`${data.education.length} education entries`);
    if (data.workExperience.length > 0) extractedItems.push(`${data.workExperience.length} work experiences`);
    if (data.certifications.length > 0) extractedItems.push(`${data.certifications.length} certifications`);
    if (data.skills.length > 0) extractedItems.push(`${data.skills.length} skills`);

    toast({
      title: 'Data extracted successfully',
      description: `Found: ${extractedItems.join(', ')}. Please review the pre-filled information and click Save to update your profile.`,
      duration: 6000,
    });

    // TODO: Store the parsed work experience, education, certifications in state
    // These should be added through the dedicated form sections (WorkExperienceForm, EducationForm, etc.)
    // For now, we're just pre-filling the basic profile info and logging the rest
    console.log('Parsed education:', data.education);
    console.log('Parsed work experience:', data.workExperience);
    console.log('Parsed certifications:', data.certifications);
    console.log('Parsed skills:', data.skills);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LinkedInImport onImport={handleLinkedInImport} />
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-3">Import from CV</label>
              <div className="space-y-2">
                {cvFile ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-blue-900">{cvFile.name}</span>
                        <span className="text-xs text-blue-600">Ready to upload - Click Save to confirm</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCVRemove}
                    >
                      Remove
                    </Button>
                  </div>
                ) : formData.cv ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-talendeur-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">CV Uploaded</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCVRemove}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleCVChange}
                      className="cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-4" />
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="headline" className="block text-sm font-medium mb-1">Headline (One-sentence professional summary)</label>
              <Input
                id="headline"
                name="headline"
                value={(formData as any).headline || ''}
                onChange={handleChange}
                placeholder="e.g., Senior Software Engineer | AI Enthusiast | Building the Future"
                maxLength={120}
              />
              <p className="text-xs text-gray-500 mt-1">Displayed prominently on your profile</p>
            </div>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-1">Bio</label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself, your experience and what you're looking for"
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-3">Profile Picture</label>
              <ImageUpload
                currentImageUrl={formData.profilePic}
                onImageChange={handleImageChange}
                onImageRemove={handleImageRemove}
                uploading={uploadingImage}
                size="lg"
                fallbackText={formData.name?.charAt(0).toUpperCase() || 'U'}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          className="bg-gradient-to-r from-white via-talendeur-orange to-talendeur-primary hover:opacity-90"
          disabled={isSubmitting || uploadingImage || uploadingCV}
        >
          {uploadingImage ? 'Uploading image...' : uploadingCV ? 'Uploading CV...' : isSubmitting ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  );
};

export default JobSeekerProfileForm;
