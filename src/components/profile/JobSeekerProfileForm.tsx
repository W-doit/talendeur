
import React, { useRef, useState } from 'react';
import { useAuth, JobSeekerProfile } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/ui/image-upload';
import { LinkedInImport } from '@/components/profile/LinkedInImport';
import { uploadProfilePicture, uploadCV } from '@/lib/supabase-storage';
import { ParsedData } from '@/lib/pdf-parser';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getExistingCvSectionCounts, persistParsedCVData } from '@/lib/persist-cv-import';
import { normalizeParsedCvData } from '@/lib/normalize-parsed-cv';
import { CvImportReviewDialog } from '@/components/profile/CvImportReviewDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface JobSeekerProfileFormProps {
  onSaveComplete?: () => void;
  importedData?: { parsedData: any; pdfFile: File } | null;
  onDataImport?: (data: any) => void;
  onParsingStart?: () => void;
  onImportPersisted?: () => void;
}

const JobSeekerProfileForm: React.FC<JobSeekerProfileFormProps> = ({ 
  onSaveComplete,
  importedData,
  onDataImport,
  onParsingStart,
  onImportPersisted,
}) => {
  const { user, updateProfile } = useAuth();
  const profile = user?.profile as JobSeekerProfile | null;
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Partial<JobSeekerProfile>>({
    name: profile?.name || '',
    headline: profile?.headline || '',
    bio: profile?.bio || '',
    profilePic: profile?.profilePic || '',
    cv: profile?.cv || '',
    videoUrl: profile?.videoUrl || '',
    portfolioUrl: profile?.portfolioUrl || '',
    openToRelocation: profile?.openToRelocation || false,
    targetOrganizations: profile?.targetOrganizations || [],
  });
  const [targetOrgsInput, setTargetOrgsInput] = useState(
    (profile?.targetOrganizations || []).join(', ')
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [replaceDialogSummary, setReplaceDialogSummary] = useState('');
  const replaceResolverRef = useRef<((confirmed: boolean) => void) | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewData, setReviewData] = useState<ParsedData | null>(null);
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [pendingCvUrl, setPendingCvUrl] = useState('');
  const [applyingImport, setApplyingImport] = useState(false);

  const askReplaceConfirmation = (summary: string): Promise<boolean> => {
    return new Promise((resolve) => {
      replaceResolverRef.current = resolve;
      setReplaceDialogSummary(summary);
      setReplaceDialogOpen(true);
    });
  };

  const settleReplaceDialog = (confirmed: boolean) => {
    if (!replaceResolverRef.current) return;
    const resolve = replaceResolverRef.current;
    replaceResolverRef.current = null;
    setReplaceDialogOpen(false);
    resolve(confirmed);
  };
  const [isParsing, setIsParsing] = useState(false);

  // Keep form in sync after profile reloads from save
  React.useEffect(() => {
    if (!profile || isSubmitting) return;
    setFormData(prev => ({
      ...prev,
      name: profile.name || '',
      headline: profile.headline || '',
      bio: profile.bio || '',
      profilePic: profile.profilePic || '',
      cv: profile.cv || '',
      videoUrl: profile.videoUrl || '',
      portfolioUrl: profile.portfolioUrl || '',
      openToRelocation: profile.openToRelocation || false,
      targetOrganizations: profile.targetOrganizations || [],
    }));
    setTargetOrgsInput((profile.targetOrganizations || []).join(', '));
  }, [
    profile?.name,
    profile?.headline,
    profile?.bio,
    profile?.profilePic,
    profile?.cv,
    profile?.videoUrl,
    profile?.portfolioUrl,
    profile?.openToRelocation,
    profile?.targetOrganizations,
  ]);

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
        openToRelocation: !!formData.openToRelocation,
        targetOrganizations: targetOrgsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
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
    setIsParsing(false);

    const normalized = normalizeParsedCvData(data);

    // Upload CV file first; profile sections wait for review confirmation
    let cvUrl = formData.cv;
    if (pdfFile && user?.id) {
      setUploadingCV(true);
      try {
        cvUrl = await uploadCV(pdfFile, user.id);
        setFormData((prev) => ({ ...prev, cv: cvUrl }));
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

    setPendingPdfFile(pdfFile);
    setPendingCvUrl(cvUrl || '');
    setReviewData(normalized);
    setReviewOpen(true);
    setCvFile(pdfFile);

    toast({
      title: 'CV extracted — review before applying',
      description: 'Check titles, companies, and dates in the review window, then Apply to profile.',
      duration: 6000,
    });
  };

  const applyReviewedImport = async (data: ParsedData) => {
    if (!user?.id) return;

    setApplyingImport(true);
    const pdfFile = pendingPdfFile;
    const cvUrl = pendingCvUrl || formData.cv || '';

    try {
      const fullName = `${data.profile.firstName || ''} ${data.profile.surname || ''}`.trim();
      const nextName = fullName || formData.name;
      const nextHeadline = data.profile.headline || formData.headline;
      const nextBio = data.profile.bio || formData.bio;

      if (onDataImport && pdfFile) {
        onDataImport({ parsedData: data, pdfFile });
      }

      setFormData((prev) => ({
        ...prev,
        name: nextName,
        headline: nextHeadline,
        bio: nextBio,
        email: data.profile.email || prev.email,
        cv: cvUrl,
      }));

      await updateProfile({
        name: nextName,
        headline: nextHeadline,
        bio: nextBio,
        cv: cvUrl,
      });

      let persistSummary = '';
      const existing = await getExistingCvSectionCounts(user.id);
      const existingTotal =
        existing.workCount + existing.educationCount + existing.certificationCount;

      let shouldPersist = true;
      if (existingTotal > 0) {
        const existingParts: string[] = [];
        if (existing.workCount) existingParts.push(`${existing.workCount} work`);
        if (existing.educationCount) existingParts.push(`${existing.educationCount} education`);
        if (existing.certificationCount) {
          existingParts.push(`${existing.certificationCount} certification`);
        }
        shouldPersist = await askReplaceConfirmation(
          `You already have ${existingParts.join(', ')} on your live profile. Applying this import will replace those sections.`
        );
        if (!shouldPersist) {
          toast({
            title: 'Applied to edit forms only',
            description:
              'Your live work/education/certs were not overwritten. Open each tab and Save if you want to keep the reviewed data.',
            duration: 8000,
          });
        }
      }

      if (shouldPersist) {
        const result = await persistParsedCVData(user.id, data);
        const parts = [];
        if (result.workCount) parts.push(`${result.workCount} work`);
        if (result.educationCount) parts.push(`${result.educationCount} education`);
        if (result.certificationCount) parts.push(`${result.certificationCount} certifications`);
        if (result.skillsSaved) parts.push('skills');
        persistSummary = parts.length
          ? ` Saved to your live profile (${parts.join(', ')}).`
          : ' Basic profile saved to your live profile.';

        const lossWarnings: string[] = [];
        if (result.previous.workCount > result.workCount && result.workCount > 0) {
          lossWarnings.push(`work (${result.previous.workCount} → ${result.workCount})`);
        }
        if (result.previous.educationCount > result.educationCount && result.educationCount > 0) {
          lossWarnings.push(
            `education (${result.previous.educationCount} → ${result.educationCount})`
          );
        }
        if (
          result.previous.certificationCount > result.certificationCount &&
          result.certificationCount > 0
        ) {
          lossWarnings.push(
            `certifications (${result.previous.certificationCount} → ${result.certificationCount})`
          );
        }
        if (lossWarnings.length > 0) {
          toast({
            title: 'Import saved fewer items',
            description: `Some sections have fewer entries than before: ${lossWarnings.join('; ')}. Review the tabs and restore anything missing.`,
            variant: 'destructive',
            duration: 12000,
          });
        }

        onImportPersisted?.();
      }

      const extractedItems = [];
      if (data.profile.firstName) extractedItems.push('name');
      if (data.profile.bio) extractedItems.push('bio');
      if (data.education.length > 0) extractedItems.push(`${data.education.length} education`);
      if (data.workExperience.length > 0) {
        extractedItems.push(`${data.workExperience.length} work`);
      }
      if (data.certifications.length > 0) {
        extractedItems.push(`${data.certifications.length} certifications`);
      }
      if (data.skills.length > 0) extractedItems.push(`${data.skills.length} skills`);

      toast({
        title: 'CV import applied ✓',
        description: `Found: ${extractedItems.join(', ') || 'profile fields'}.${persistSummary}`,
        duration: 10000,
      });

      setReviewOpen(false);
      setReviewData(null);
      setPendingPdfFile(null);
    } catch (persistError) {
      console.error('Apply CV import failed:', persistError);
      toast({
        title: 'Could not apply import',
        description:
          'Reviewed data is in the edit forms where possible, but live profile sync failed. Open each tab and click Save.',
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setApplyingImport(false);
    }
  };

  const discardReviewedImport = () => {
    if (!reviewData && !reviewOpen) return;
    setReviewOpen(false);
    setReviewData(null);
    setPendingPdfFile(null);
    toast({
      title: 'Import discarded',
      description: 'Extracted CV data was not applied. Your live profile is unchanged.',
      duration: 5000,
    });
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      <LinkedInImport 
        onImport={handleLinkedInImport}
        currentCV={formData.cv}
        onCVRemove={() => setFormData(prev => ({ ...prev, cv: '' }))}
        onParsingStart={() => {
          setIsParsing(true);
          if (onParsingStart) onParsingStart();
        }}
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

            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="openToRelocation"
                checked={!!formData.openToRelocation}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, openToRelocation: checked === true }))
                }
              />
              <Label htmlFor="openToRelocation">Open to relocation</Label>
            </div>

            <div>
              <label htmlFor="targetOrganizations" className="block text-sm font-medium mb-1">
                Looking to connect with (organizations / sectors)
              </label>
              <Input
                id="targetOrganizations"
                value={targetOrgsInput}
                onChange={(e) => setTargetOrgsInput(e.target.value)}
                placeholder="e.g., UNESCO, renewable energy startups, NGOs"
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated list of organizations or sectors</p>
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
          className="bg-talendeur-primary hover:bg-talendeur-primary-dark text-white"
          disabled={isSubmitting || uploadingImage || uploadingCV || isParsing}
        >
          {isParsing ? 'Parsing CV...' : uploadingImage ? 'Uploading image...' : uploadingCV ? 'Uploading CV...' : isSubmitting ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>

    <AlertDialog
      open={replaceDialogOpen}
      onOpenChange={(open) => {
        if (!open) settleReplaceDialog(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Replace existing profile data?</AlertDialogTitle>
          <AlertDialogDescription>{replaceDialogSummary}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => settleReplaceDialog(false)}>
            Keep existing live data
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => settleReplaceDialog(true)}>
            Replace with import
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <CvImportReviewDialog
      open={reviewOpen}
      initialData={reviewData}
      applying={applyingImport}
      onOpenChange={(open) => {
        if (open) {
          setReviewOpen(true);
          return;
        }
        // Avoid discard toast when Apply closes the dialog
        if (applyingImport) {
          setReviewOpen(false);
          return;
        }
        if (reviewData) discardReviewedImport();
        else setReviewOpen(false);
      }}
      onApply={applyReviewedImport}
      onDiscard={discardReviewedImport}
    />
    </>
  );
};

export default JobSeekerProfileForm;
