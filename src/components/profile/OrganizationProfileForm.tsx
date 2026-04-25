
import React, { useState } from 'react';
import { useAuth, OrganizationProfile, OrganizationContact } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ImageUpload from '@/components/ui/image-upload';
import { uploadProfilePicture } from '@/lib/supabase-storage';
import { X, Star } from 'lucide-react';

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
    videoUrl: (profile as any)?.videoUrl || '',
    contacts: profile?.contacts || []
  });
  
  const [needInput, setNeedInput] = useState('');
  const [contactForm, setContactForm] = useState<OrganizationContact>({
    contactName: '',
    contactEmail: '',
    contactRole: '',
    isPrimary: false
  });
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

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddContact = () => {
    if (!contactForm.contactName.trim() || !contactForm.contactEmail.trim() || !contactForm.contactRole.trim()) {
      return;
    }

    const newContact: OrganizationContact = {
      contactName: contactForm.contactName.trim(),
      contactEmail: contactForm.contactEmail.trim(),
      contactRole: contactForm.contactRole.trim(),
      isPrimary: contactForm.isPrimary || (formData.contacts?.length === 0), // First contact is primary by default
    };

    setFormData(prev => ({
      ...prev,
      contacts: [...(prev.contacts || []), newContact]
    }));

    // Reset contact form
    setContactForm({
      contactName: '',
      contactEmail: '',
      contactRole: '',
      isPrimary: false
    });
  };

  const handleRemoveContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contacts: (prev.contacts || []).filter((_, i) => i !== index)
    }));
  };

  const handleSetPrimaryContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contacts: (prev.contacts || []).map((contact, i) => ({
        ...contact,
        isPrimary: i === index
      }))
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
      
      // Show success toast - stay on form for review
      toast({
        title: 'Profile saved',
        description: 'Your organization profile has been updated successfully.',
        duration: 3000,
      });
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
              <p className="text-xs text-gray-500 mt-1">Upload a video to YouTube or Vimeo and add the link here (2-minute max recommended)</p>
            </div>
            
            <div>
              <label htmlFor="portfolioUrl" className="block text-sm font-medium mb-1">Portfolio/Projects Link (Optional)</label>
              <Input
                id="portfolioUrl"
                name="portfolioUrl"
                value={(formData as any).portfolioUrl || ''}
                onChange={handleChange}
                placeholder="https://yourcompany.com/projects or https://github.com/yourorg"
                type="url"
              />
              <p className="text-xs text-gray-500 mt-1">Add a link to showcase your organization's projects, case studies, or portfolio</p>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Contact Persons</h3>
          <p className="text-sm text-gray-600 mb-4">Add one or more contact persons for your organization. The first contact will be marked as primary by default.</p>
          
          {/* Existing contacts list */}
          {formData.contacts && formData.contacts.length > 0 && (
            <div className="space-y-2 mb-4">
              {formData.contacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{contact.contactName}</p>
                      {contact.isPrimary && (
                        <Badge variant="default" className="bg-talendeur-primary text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{contact.contactRole}</p>
                    <p className="text-sm text-gray-500">{contact.contactEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    {!contact.isPrimary && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimaryContact(index)}
                        className="text-xs"
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveContact(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add new contact form */}
          <div className="space-y-3 p-4 border rounded-lg bg-white">
            <p className="text-sm font-medium text-gray-700">Add Contact Person</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Input
                  name="contactName"
                  value={contactForm.contactName}
                  onChange={handleContactFormChange}
                  placeholder="Full Name *"
                />
              </div>
              <div>
                <Input
                  name="contactEmail"
                  type="email"
                  value={contactForm.contactEmail}
                  onChange={handleContactFormChange}
                  placeholder="Email *"
                />
              </div>
              <div>
                <Input
                  name="contactRole"
                  value={contactForm.contactRole}
                  onChange={handleContactFormChange}
                  placeholder="Role/Title *"
                />
              </div>
              <div className="flex items-center">
                <Button
                  type="button"
                  onClick={handleAddContact}
                  className="w-full bg-gradient-to-r from-talendeur-orange to-talendeur-primary hover:opacity-90"
                  disabled={!contactForm.contactName.trim() || !contactForm.contactEmail.trim() || !contactForm.contactRole.trim()}
                >
                  Add Contact
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
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
