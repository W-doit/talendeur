import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Education {
  id?: string;
  institution: string;
  qualification_type: string;
  subject: string;
  start_date: string;
  end_date: string;
  still_studying: boolean;
}

const QUALIFICATION_TYPES = [
  'PhD',
  'Master',
  'Bachelor',
  'Associate',
  'Certificate',
  'Diploma',
  'High School'
];

export const EducationForm = () => {
  const { user } = useAuth();
  const [educations, setEducations] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasFetched, setHasFetched] = useState(false); // Track if we've already fetched

  const fetchEducation = useCallback(async () => {
    // Don't refetch if we already tried
    if (hasFetched) {
      setLoading(false);
      return;
    }
    
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.error('EducationForm: No active session!');
        setLoading(false);
        return;
      }
      
      
      const { data, error } = await supabase
        .from('education_history')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      setEducations(data || []);
      setHasFetched(true); // Mark as fetched
    } catch (error) {
      console.error('Error fetching education:', error);
      setEducations([]);
      setHasFetched(true); // Mark as attempted even on error
    } finally {
      setLoading(false);
    }
  }, [user, hasFetched]);

  useEffect(() => {
    fetchEducation();
  }, [fetchEducation]);

  const addNewEducation = () => {
    setEducations([
      ...educations,
      {
        institution: '',
        qualification_type: '',
        subject: '',
        start_date: '',
        end_date: '',
        still_studying: false,
      },
    ]);
  };

  const updateEducation = (index: number, field: keyof Education, value: string | boolean) => {
    const updated = [...educations];
    updated[index] = { ...updated[index], [field]: value };
    setEducations(updated);
  };

  const removeEducation = async (index: number) => {
    const education = educations[index];
    
    if (education.id) {
      try {
        const { error } = await supabase
          .from('education_history')
          .delete()
          .eq('id', education.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting education:', error);
        return;
      }
    }

    const updated = educations.filter((_, i) => i !== index);
    setEducations(updated);
  };

  const saveEducations = async () => {
    if (!user) return;

    setSaving(true);
    try {
      for (const edu of educations) {
        if (!edu.institution || !edu.qualification_type) continue;

        if (edu.id) {
          const { error } = await supabase
            .from('education_history')
            .update({
              institution: edu.institution,
              qualification_type: edu.qualification_type,
              subject: edu.subject,
              start_date: edu.start_date,
              end_date: edu.end_date,
              still_studying: edu.still_studying,
            })
            .eq('id', edu.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('education_history')
            .insert({
              user_id: user.id,
              institution: edu.institution,
              qualification_type: edu.qualification_type,
              subject: edu.subject,
              start_date: edu.start_date,
              end_date: edu.end_date,
              still_studying: edu.still_studying,
            });

          if (error) throw error;
        }
      }

      await fetchEducation();
    } catch (error) {
      console.error('Error saving education:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading education...</div>;
  }

  if (!user) {
    return <div className="text-center py-4 text-muted-foreground">Please log in to manage your education.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-talendeur-primary" />
          Education
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {educations.map((edu, index) => (
          <Card key={index} className="border-2">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Institution *</label>
                  <Input
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    placeholder="e.g., University of California, Berkeley"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Qualification Type *</label>
                  <select
                    value={edu.qualification_type}
                    onChange={(e) => updateEducation(index, 'qualification_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-talendeur-primary"
                  >
                    <option value="">Select qualification</option>
                    {QUALIFICATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-medium mb-1">Subject/Major</label>
                  <Input
                    value={edu.subject}
                    onChange={(e) => updateEducation(index, 'subject', e.target.value)}
                    placeholder="e.g., Data Science, Computer Science"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={edu.start_date}
                    onChange={(e) => updateEducation(index, 'start_date', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <Input
                    type="date"
                    value={edu.end_date}
                    onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                    disabled={edu.still_studying}
                  />
                </div>

                <div className="col-span-full flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`studying-${index}`}
                      checked={edu.still_studying}
                      onCheckedChange={(checked) => updateEducation(index, 'still_studying', checked as boolean)}
                    />
                    <label htmlFor={`studying-${index}`} className="text-sm cursor-pointer">
                      I am currently studying here
                    </label>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeEducation(index)}
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
          onClick={addNewEducation}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Education
        </Button>

        <div className="flex justify-end pt-4">
          <Button
            onClick={saveEducations}
            disabled={saving}
            className="bg-gradient-to-r from-white via-talendeur-orange to-talendeur-primary hover:opacity-90 text-white"
          >
            {saving ? 'Saving...' : 'Save Education'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
