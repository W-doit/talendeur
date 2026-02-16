
import React, { useState } from 'react';
import { useAuth, OrganizationProfile } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import ImageUpload from '@/components/ui/image-upload';
import { uploadProfilePicture } from '@/lib/supabase-storage';

interface OrganizationProfileFormProps {
  onSaveComplete?: () => void;
}

const OrganizationProfileForm: React.FC<OrganizationProfileFormProps> = ({ onSaveComplete }) => {
  const { user, updateProfile } = useAuth();
  const profile = user?.profile as OrganizationProfile | null;
  
  const [formData, setFormData] = useState<Partial<OrganizationProfile>>({
    name: profile?.name || '',
    headline: (profile as any)?.headline || '',
    about: profile?.about || '',
    website: profile?.website || '',
    logo: profile?.logo || '',
    needs: profile?.needs || [],
    videoUrl: (profile as any)?.videoUrl || ''
  });
  
  const [needInput, setNeedInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddNeed = () => {
    if (!needInput.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      needs: [...(prev.needs || []), needInput.trim()]
    }));
    
    setNeedInput('');
  };

  const handleRemoveNeed = (need: string) => {
    setFormData(prev => ({
      ...prev,
      needs: (prev.needs || []).filter(n => n !== need)
    }));
  };

  const handleLogoChange = (file: File) => {
    setLogoFile(file);
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setFormData(prev => ({
      ...prev,
      logo: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let logoUrl = formData.logo;

      // Upload logo if a new one was selected
      if (logoFile && user?.id) {
        setUploadingLogo(true);
        try {
          logoUrl = await uploadProfilePicture(logoFile, user.id);
        } catch (uploadError) {
          console.error('Logo upload error:', uploadError);
          throw new Error('Failed to upload logo');
        } finally {
          setUploadingLogo(false);
        }
      }

      // Update profile with the logo URL
      await updateProfile({
        ...formData,
        logo: logoUrl
      });

      setLogoFile(null);
      
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Organization Name</label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your organization's name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="headline" className="block text-sm font-medium mb-1">Headline (One-sentence description)</label>
              <Input
                id="headline"
                name="headline"
                value={(formData as any).headline || ''}
                onChange={handleChange}
                placeholder="e.g., Innovative Tech Company | Empowering the Next Generation"
                maxLength={120}
              />
              <p className="text-xs text-gray-500 mt-1">Displayed prominently on your profile</p>
            </div>
            
            <div>
              <label htmlFor="about" className="block text-sm font-medium mb-1">About</label>
              <Textarea
                id="about"
                name="about"
                value={formData.about}
                onChange={handleChange}
                placeholder="Tell us about your organization, its mission, and culture"
                rows={4}
              />
            </div>
            
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium mb-1">Organization Video (Optional)</label>
              <Input
                id="videoUrl"
                name="videoUrl"
                value={(formData as any).videoUrl || ''}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                type="url"
              />
              <p className="text-xs text-gray-500 mt-1">Add a link to your 2-minute organization video (YouTube, Vimeo, etc.)</p>
            </div>
            
            <div>
              <label htmlFor="website" className="block text-sm font-medium mb-1">Website</label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://your-organization.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-3">Organization Logo</label>
              <ImageUpload
                currentImageUrl={formData.logo}
                onImageChange={handleLogoChange}
                onImageRemove={handleLogoRemove}
                uploading={uploadingLogo}
                size="lg"
                fallbackText={formData.name?.charAt(0).toUpperCase() || 'O'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Current Needs</label>
              <div className="flex space-x-2">
                <Input
                  value={needInput}
                  onChange={(e) => setNeedInput(e.target.value)}
                  placeholder="Add a position or skill you need"
                />
                <Button 
                  type="button" 
                  onClick={handleAddNeed}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.needs?.map((need, index) => (
                  <div 
                    key={index}
                    className="bg-muted rounded-full px-3 py-1 text-sm flex items-center"
                  >
                    {need}
                    <button
                      type="button"
                      onClick={() => handleRemoveNeed(need)}
                      className="ml-2 text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          className="bg-gradient-to-r from-white via-talendeur-orange to-talendeur-primary hover:opacity-90"
          disabled={isSubmitting || uploadingLogo}
        >
          {uploadingLogo ? 'Uploading logo...' : isSubmitting ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  );
};

export default OrganizationProfileForm;
