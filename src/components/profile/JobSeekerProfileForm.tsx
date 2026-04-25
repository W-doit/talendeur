
import React, { useState } from 'react';
import { useAuth, JobSeekerProfile } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ImageUpload from '@/components/ui/image-upload';
import { LinkedInImport } from '@/components/profile/LinkedInImport';
import { uploadProfilePicture, uploadCV } from '@/lib/supabase-storage';
import { ParsedData } from '@/lib/pdf-parser';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
    cv: profile?.cv || '',
    videoUrl: (profile as any)?.videoUrl || '',
    portfolioUrl: (profile as any)?.portfolioUrl || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

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
        cv: cvUrl,
      });

      // Update profile with the image and CV URLs
      await updateProfile({
        ...formData,
        profilePic: profilePicUrl,
        cv: cvUrl,
      });

      console.log('Profile updated successfully');

      setCvFile(null);
      setImageFile(null);
      
      // Show success toast - stay on form to allow reviewing all tabs
      toast({
        title: 'Profile saved',
        description: 'Your profile has been updated successfully.',
        duration: 3000,
      });
      
      // Call the onSaveComplete callback if provided (for tab navigation)
      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkedInImport = async (data: ParsedData, pdfFile: File) => {
    console.log('handleLinkedInImport called with data:', data);
    setIsParsing(false); // Parsing complete
    
    // Immediately upload the CV file to storage
    let cvUrl = formData.cv;
    if (pdfFile && user?.id) {
      console.log('Uploading imported CV immediately...', pdfFile);
      setUploadingCV(true);
      try {
        cvUrl = await uploadCV(pdfFile, user.id);
        console.log('Imported CV uploaded successfully:', cvUrl);
        
        // Update formData with the new CV URL
        setFormData(prev => ({
          ...prev,
          cv: cvUrl,
        }));
      } catch (uploadError) {
        console.error('CV upload error:', uploadError);
        toast({
          title: 'CV upload failed',
          description: 'Could not upload CV file. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setUploadingCV(false);
      }
    }
    
    // Store data in parent component to persist across tab changes
    if (onDataImport) {
      const importedDataToPass = { parsedData: data, pdfFile };
      console.log('Calling onDataImport with:', importedDataToPass);
      onDataImport(importedDataToPass);
    }
    
    // Store the PDF file to be uploaded later (backup)
    setCvFile(pdfFile);
    
    // Pre-fill profile information - combine all updates in one setState call
    const fullName = `${data.profile.firstName || ''} ${data.profile.surname || ''}`.trim();
    
    setFormData(prev => ({
      ...prev,
      name: fullName || prev.name,
      headline: data.profile.headline || prev.headline,
      bio: data.profile.bio || prev.bio,
      email: data.profile.email || prev.email,
      cv: cvUrl, // Use the uploaded CV URL
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
      title: 'CV data extracted successfully! ✓',
      description: `Found: ${extractedItems.join(', ')}. Please review each tab below (Work Experience, Education, Certifications) to verify the information. Don't forget to complete the Personality Test before viewing your profile!`,
      duration: 10000,
    });

    // TODO: Store the parsed work experience, education, certifications in state
    // These should be added through the dedicated form sections (WorkExperienceForm, EducationForm, etc.)
    // For now, we're just pre-filling the basic profile info and logging the rest
    console.log('Parsed education:', data.education);
    console.log('Parsed work experience:', data.workExperience);
    console.log('Parsed certifications:', data.certifications);
    console.log('Parsed skills:', data.skills);
    console.log('Full parsed data object:', data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LinkedInImport 
        onImport={handleLinkedInImport}
        currentCV={formData.cv}
        onCVRemove={() => setFormData(prev => ({ ...prev, cv: '' }))}
        onParsingStart={() => setIsParsing(true)}
        onParsingEnd={() => setIsParsing(false)}
      />
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
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
              <label htmlFor="videoUrl" className="block text-sm font-medium mb-1">Profile Video (Optional)</label>
              <Input
                id="videoUrl"
                name="videoUrl"
                value={(formData as any).videoUrl || ''}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                type="url"
              />
              <p className="text-xs text-gray-500 mt-1">Upload a video to YouTube or Vimeo and add the link here (2-minute max recommended)</p>
            </div>
            
            <div>
              <label htmlFor="portfolioUrl" className="block text-sm font-medium mb-1">Portfolio Link (Optional)</label>
              <Input
                id="portfolioUrl"
                name="portfolioUrl"
                value={(formData as any).portfolioUrl || ''}
                onChange={handleChange}
                placeholder="https://yourportfolio.com or https://github.com/yourusername"
                type="url"
              />
              <p className="text-xs text-gray-500 mt-1">Add a link to your portfolio, GitHub, Behance, or personal website</p>
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
          disabled={isSubmitting || uploadingImage || uploadingCV || isParsing}
        >
          {isParsing ? 'Parsing CV...' : uploadingImage ? 'Uploading image...' : uploadingCV ? 'Uploading CV...' : isSubmitting ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  );
};

export default JobSeekerProfileForm;
