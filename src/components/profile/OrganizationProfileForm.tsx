
import React, { useState } from 'react';
import { useAuth, OrganizationProfile } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

const OrganizationProfileForm: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const profile = user?.profile as OrganizationProfile | null;
  
  const [formData, setFormData] = useState<Partial<OrganizationProfile>>({
    name: profile?.name || '',
    about: profile?.about || '',
    website: profile?.website || '',
    logo: profile?.logo || '',
    needs: profile?.needs || []
  });
  
  const [needInput, setNeedInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateProfile(formData);
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
              <label htmlFor="logo" className="block text-sm font-medium mb-1">Logo URL</label>
              <Input
                id="logo"
                name="logo"
                value={formData.logo}
                onChange={handleChange}
                placeholder="URL to your organization's logo"
              />
              {formData.logo && (
                <div className="mt-2 flex justify-center">
                  <img 
                    src={formData.logo} 
                    alt="Logo preview" 
                    className="h-32 w-32 object-contain border-2 border-muted rounded-lg p-2"
                  />
                </div>
              )}
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
          className="bg-talendeur-red hover:bg-talendeur-darkred"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  );
};

export default OrganizationProfileForm;
