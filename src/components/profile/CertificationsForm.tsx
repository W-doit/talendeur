import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Certification {
  id?: string;
  course_name: string;
  certification_type: string;
  date_attained: string;
  details: string;
}

const CERTIFICATION_TYPES = [
  'Project Management',
  'Data Analysis',
  'Technology',
  'Leadership',
  'Business Strategy',
  'Marketing',
  'Design',
  'Finance',
  'HR',
  'Other'
];

interface CertificationsFormProps {
  importedData?: any[];
  onSaveComplete?: () => void;
}

export const CertificationsForm = ({ importedData, onSaveComplete }: CertificationsFormProps = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataSource, setDataSource] = useState<'none' | 'imported' | 'database'>('none');

  // PRIORITY 1: Handle imported data first
  useEffect(() => {
    console.log('CertificationsForm - checking importedData:', importedData?.length);
    
    if (importedData && Array.isArray(importedData) && importedData.length > 0) {
      console.log('Pre-filling certifications with imported CV data:', importedData);
      const mappedData = importedData.map(cert => ({
        course_name: cert.course_name || '',
        certification_type: cert.certification_type || '',
        date_attained: cert.date_attained || '',
        details: cert.details || '',
      }));
      console.log('Mapped certifications data:', mappedData);
      
      // Set imported data (replaces any existing data)
      setCertifications(mappedData);
      setDataSource('imported');
      setLoading(false);
      
      console.log('Certifications data pre-filled from CV. User should review and save.');
    } else if (dataSource === 'imported') {
      // Reset when imported data is cleared
      console.log('Imported data cleared, will fetch from database');
      setDataSource('none');
    }
  }, [importedData, dataSource]);

  // PRIORITY 2: Fetch from database only if no imported data
  useEffect(() => {
    const fetchCertifications = async () => {
      // Skip if we already have imported data or already fetched from database
      if (dataSource !== 'none') {
        console.log(`Skipping fetch - data source is: ${dataSource}`);
        return;
      }
      
      if (!user) {
        setLoading(false);
        return;
      }

      console.log('Fetching certifications from database...');

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          console.error('CertificationsForm: No active session!');
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('certifications')
          .select('*')
          .eq('user_id', user.id)
          .order('date_attained', { ascending: false });

        if (error) throw error;
        
        console.log(`Loaded ${(data || []).length} certifications from database`);
        // Normalize data to ensure no null values in form inputs
        const normalized = (data || []).map(cert => ({
          ...cert,
          date_attained: cert.date_attained || '',
          details: cert.details || ''
        }));
        setCertifications(normalized);
        setDataSource('database');
      } catch (error) {
        console.error('Error fetching certifications:', error);
        setCertifications([]);
        setDataSource('database'); // Mark as attempted
      } finally {
        setLoading(false);
      }
    };

    fetchCertifications();
  }, [user, dataSource]);

  const saveCertifications = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // If we have imported data (no IDs), delete all existing entries first to avoid duplicates
      const hasNewImports = certifications.some(cert => !cert.id && (cert.course_name || cert.certification_type));
      
      if (hasNewImports) {
        console.log('Detected imported data - deleting old certification entries to avoid duplicates');
        const { error: deleteError } = await supabase
          .from('certifications')
          .delete()
          .eq('user_id', user.id);
        
        if (deleteError) {
          console.error('Error deleting old certifications:', deleteError);
          throw deleteError;
        }
      }

      const updatedCertifications = [...certifications];

      for (let index = 0; index < certifications.length; index += 1) {
        const cert = certifications[index];
        if (!cert.course_name || !cert.certification_type) continue;

        if (cert.id && !hasNewImports) {
          // Update existing (only if not replacing all with imports)
          const { error } = await supabase
            .from('certifications')
            .update({
              course_name: cert.course_name,
              certification_type: cert.certification_type,
              date_attained: cert.date_attained || null,
              details: cert.details,
            })
            .eq('id', cert.id);

          if (error) throw error;
        } else {
          // Insert new
          const { data, error } = await supabase
            .from('certifications')
            .insert({
              user_id: user.id,
              course_name: cert.course_name,
              certification_type: cert.certification_type,
              date_attained: cert.date_attained || null,
              details: cert.details,
            })
            .select('id')
            .single();

          if (error) throw error;

          updatedCertifications[index] = { ...cert, id: data?.id };
        }
      }

      setCertifications(updatedCertifications);
      
      // After save, mark as database source (data is now persisted)
      setDataSource('database');
      
      toast({
        title: 'Certifications saved',
        description: 'Your certifications have been updated successfully.',
        duration: 3000,
      });
      
      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (error) {
      console.error('Error saving certifications:', error);
    } finally {
      setSaving(false);
    }
  };

  const addNewCertification = () => {
    setCertifications([
      ...certifications,
      {
        course_name: '',
        certification_type: '',
        date_attained: '',
        details: '',
      },
    ]);
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  const removeCertification = async (index: number) => {
    const certification = certifications[index];
    
    if (certification.id) {
      try {
        const { error } = await supabase
          .from('certifications')
          .delete()
          .eq('id', certification.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting certification:', error);
        return;
      }
    }

    const updated = certifications.filter((_, i) => i !== index);
    setCertifications(updated);
  };

  if (loading) {
    return <div className="text-center py-4">Loading certifications...</div>;
  }

  if (!user) {
    return <div className="text-center py-4 text-muted-foreground">Please log in to manage your certifications.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-talendeur-primary" />
          Certifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {certifications.map((cert, index) => (
          <Card key={index} className="border-2">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Course/Certification Name *</label>
                  <Input
                    value={cert.course_name}
                    onChange={(e) => updateCertification(index, 'course_name', e.target.value)}
                    placeholder="e.g., PMP Certification"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select
                    value={cert.certification_type}
                    onChange={(e) => updateCertification(index, 'certification_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-talendeur-primary"
                  >
                    <option value="">Select type</option>
                    {CERTIFICATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date Attained</label>
                  <Input
                    type="date"
                    value={cert.date_attained}
                    onChange={(e) => updateCertification(index, 'date_attained', e.target.value)}
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-medium mb-1">Details</label>
                  <Textarea
                    value={cert.details}
                    onChange={(e) => updateCertification(index, 'details', e.target.value)}
                    placeholder="Additional information about this certification..."
                    rows={2}
                  />
                </div>

                <div className="col-span-full flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeCertification(index)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addNewCertification}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Certification
        </Button>

        <div className="flex justify-end pt-4">
          <Button
            onClick={saveCertifications}
            disabled={saving}
            className="bg-gradient-to-r from-white via-talendeur-orange to-talendeur-primary hover:opacity-90 text-white"
          >
            {saving ? 'Saving...' : 'Save Certifications'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
