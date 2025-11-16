import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

export const CertificationsForm = () => {
  const { user } = useAuth();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCertifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', user.id)
        .order('date_attained', { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
    } catch (error) {
      console.error('Error fetching certifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCertifications();
  }, [fetchCertifications]);

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

  const saveCertifications = async () => {
    if (!user) return;

    setSaving(true);
    try {
      for (const cert of certifications) {
        if (!cert.course_name || !cert.certification_type) continue;

        if (cert.id) {
          const { error } = await supabase
            .from('certifications')
            .update({
              course_name: cert.course_name,
              certification_type: cert.certification_type,
              date_attained: cert.date_attained,
              details: cert.details,
            })
            .eq('id', cert.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('certifications')
            .insert({
              user_id: user.id,
              course_name: cert.course_name,
              certification_type: cert.certification_type,
              date_attained: cert.date_attained,
              details: cert.details,
            });

          if (error) throw error;
        }
      }

      await fetchCertifications();
    } catch (error) {
      console.error('Error saving certifications:', error);
    } finally {
      setSaving(false);
    }
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
            className="bg-talendeur-primary hover:bg-talendeur-primary-dark"
          >
            {saving ? 'Saving...' : 'Save Certifications'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
