
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

interface JobSeekerProfileFormProps {
  onSaveComplete?: () => void;
}

const JobSeekerProfileForm: React.FC<JobSeekerProfileFormProps> = ({ onSaveComplete }) => {
  const { user, updateProfile } = useAuth();
  const profile = user?.profile as JobSeekerProfile | null;
  
  const [formData, setFormData] = useState<Partial<JobSeekerProfile>>({
    name: profile?.name || '',
    bio: profile?.bio || '',
    interests: profile?.interests || [],
    skills: profile?.skills || { soft: 70, hard: 70, feedback: 70, learning: 70 },
    profilePic: profile?.profilePic || ''
  });
  
  const [interestsInput, setInterestsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const handleAddInterest = () => {
    if (!interestsInput.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      interests: [...(prev.interests || []), interestsInput.trim()]
    }));
    
    setInterestsInput('');
  };

  const handleRemoveInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: (prev.interests || []).filter(i => i !== interest)
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
    setIsSubmitting(true);
    
    try {
      let profilePicUrl = formData.profilePic;

      // Upload image if a new one was selected
      if (imageFile && user?.id) {
        setUploadingImage(true);
        try {
          profilePicUrl = await uploadProfilePicture(imageFile, user.id);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          throw new Error('Failed to upload profile picture');
        } finally {
          setUploadingImage(false);
        }
      }

      // Update profile with the image URL
      await updateProfile({
        ...formData,
        profilePic: profilePicUrl
      });

      setImageFile(null);
      
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

  const handleLinkedInImport = (data: unknown) => {
    const linkedInData = data as any;
    
    // Update form with LinkedIn data
    if (linkedInData.profile) {
      setFormData(prev => ({
        ...prev,
        name: `${linkedInData.profile.first_name} ${linkedInData.profile.surname}`.trim() || prev.name,
        bio: linkedInData.profile.bio || prev.bio,
        profilePic: linkedInData.profile.profile_pic || prev.profilePic,
      }));
    }

    // Add skills if available
    if (linkedInData.skills && Array.isArray(linkedInData.skills)) {
      setFormData(prev => ({
        ...prev,
        interests: [...(prev.interests || []), ...linkedInData.skills],
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LinkedInImport onImport={handleLinkedInImport} />
      
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
            
            <div>
              <label className="block text-sm font-medium mb-1">Interests</label>
              <div className="flex space-x-2">
                <Input
                  value={interestsInput}
                  onChange={(e) => setInterestsInput(e.target.value)}
                  placeholder="Add an interest or skill"
                />
                <Button 
                  type="button" 
                  onClick={handleAddInterest}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.interests?.map((interest, index) => (
                  <div 
                    key={index}
                    className="bg-muted rounded-full px-3 py-1 text-sm flex items-center"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(interest)}
                      className="ml-2 text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Skills Evaluation</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Soft Skills</span>
                    <span>{formData.skills?.soft}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.skills?.soft}
                    onChange={(e) => handleSkillChange('soft', parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Hard Skills</span>
                    <span>{formData.skills?.hard}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.skills?.hard}
                    onChange={(e) => handleSkillChange('hard', parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Previous Feedback</span>
                    <span>{formData.skills?.feedback}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.skills?.feedback}
                    onChange={(e) => handleSkillChange('feedback', parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Continuous Learning</span>
                    <span>{formData.skills?.learning}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.skills?.learning}
                    onChange={(e) => handleSkillChange('learning', parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          className="bg-talendeur-primary hover:bg-talendeur-primary-dark"
          disabled={isSubmitting || uploadingImage}
        >
          {uploadingImage ? 'Uploading image...' : isSubmitting ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  );
};

export default JobSeekerProfileForm;
