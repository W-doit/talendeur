import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface WorkExperience {
  id?: string;
  job_title: string;
  company: string;
  start_date: string;
  end_date: string;
  still_work_here: boolean;
}

interface WorkExperienceFormProps {
  importedData?: any[];
  onSaveComplete?: () => void;
}

export const WorkExperienceForm = ({ importedData, onSaveComplete }: WorkExperienceFormProps = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataSource, setDataSource] = useState<'none' | 'imported' | 'database'>('none');

  // PRIORITY 1: Handle imported data first
  useEffect(() => {
    console.log('WorkExperienceForm - checking importedData:', importedData?.length);
    
    if (importedData && Array.isArray(importedData) && importedData.length > 0) {
      console.log('Pre-filling work experience with imported CV data:', importedData);
      const mappedData = importedData.map(exp => ({
        job_title: exp.job_title || '',
        company: exp.company || '',
        start_date: exp.start_date || '',
        end_date: exp.end_date || '',
        still_work_here: exp.still_work_here || false,
      }));
      console.log('Mapped work experience data:', mappedData);
      
      // Set imported data (replaces any existing data)
      setExperiences(mappedData);
      setDataSource('imported');
      setLoading(false);
      
      console.log('Work experience data pre-filled from CV. User should review and save.');
    } else if (dataSource === 'imported') {
      // Reset when imported data is cleared
      console.log('Imported data cleared, will fetch from database');
      setDataSource('none');
    }
  }, [importedData, dataSource]);

  // PRIORITY 2: Fetch from database only if no imported data
  useEffect(() => {
    const fetchExperiences = async () => {
      // Skip if we already have imported data or already fetched from database
      if (dataSource !== 'none') {
        console.log(`Skipping fetch - data source is: ${dataSource}`);
        return;
      }
      
      if (!user) {
        setLoading(false);
        return;
      }

      console.log('Fetching work experience from database...');

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          console.error('WorkExperienceForm: No active session!');
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('work_experience')
          .select('*')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });

        if (error) throw error;
        
        const normalized = (data || []).map((exp) => ({
          ...exp,
          still_work_here: !!exp.still_work_here,
          end_date: exp.end_date ?? '',
        }));
        
        console.log(`Loaded ${normalized.length} work experiences from database`);
        setExperiences(normalized);
        setDataSource('database');
      } catch (error) {
        console.error('Error fetching work experience:', error);
        setExperiences([]);
        setDataSource('database'); // Mark as attempted
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, [user, dataSource]);

  const addNewExperience = () => {
    setExperiences([
      ...experiences,
      {
        job_title: '',
        company: '',
        start_date: '',
        end_date: '',
        still_work_here: false,
      },
    ]);
  };

  const updateExperience = (index: number, field: keyof WorkExperience, value: string | boolean) => {
    const updated = [...experiences];
    if (field === 'still_work_here') {
      updated[index] = {
        ...updated[index],
        still_work_here: value as boolean,
        end_date: value ? '' : updated[index].end_date,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setExperiences(updated);
  };

  const removeExperience = async (index: number) => {
    const experience = experiences[index];
    
    // If it has an ID, delete from database
    if (experience.id) {
      try {
        const { error } = await supabase
          .from('work_experience')
          .delete()
          .eq('id', experience.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting work experience:', error);
        return;
      }
    }

    // Remove from state
    const updated = experiences.filter((_, i) => i !== index);
    setExperiences(updated);
  };

  const saveExperiences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // If we have imported data (no IDs), delete all existing entries first to avoid duplicates
      const hasNewImports = experiences.some(exp => !exp.id && (exp.job_title || exp.company));
      
      if (hasNewImports) {
        console.log('Detected imported data - deleting old work experience entries to avoid duplicates');
        const { error: deleteError } = await supabase
          .from('work_experience')
          .delete()
          .eq('user_id', user.id);
        
        if (deleteError) {
          console.error('Error deleting old work experience:', deleteError);
          throw deleteError;
        }
      }

      const updatedExperiences = [...experiences];

      for (let index = 0; index < experiences.length; index += 1) {
        const exp = experiences[index];
        // Skip empty entries
        if (!exp.job_title || !exp.company) continue;

        if (exp.id && !hasNewImports) {
          // Update existing (only if not replacing all with imports)
          const { error } = await supabase
            .from('work_experience')
            .update({
              job_title: exp.job_title,
              company: exp.company,
              start_date: exp.start_date || null,
              end_date: exp.still_work_here ? null : (exp.end_date || null),
              still_work_here: exp.still_work_here,
            })
            .eq('id', exp.id);

          if (error) throw error;
        } else {
          // Insert new and capture id to avoid duplicates on subsequent saves
          const { data, error } = await supabase
            .from('work_experience')
            .insert({
              user_id: user.id,
              job_title: exp.job_title,
              company: exp.company,
              start_date: exp.start_date || null,
              end_date: exp.still_work_here ? null : (exp.end_date || null),
              still_work_here: exp.still_work_here,
            })
            .select('id')
            .single();

          if (error) throw error;

          updatedExperiences[index] = { ...exp, id: data?.id };
        }
      }

      setExperiences(updatedExperiences);
      
      // After save, mark as database source (data is now persisted)
      setDataSource('database');
      
      toast({
        title: 'Work experience saved',
        description: 'Your work experience has been updated successfully.',
        duration: 3000,
      });
      
      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (error) {
      console.error('Error saving work experience:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading work experience...</div>;
  }

  if (!user) {
    return <div className="text-center py-4 text-muted-foreground">Please log in to manage your work experience.</div>;
  }

  console.log('WorkExperienceForm RENDER - experiences:', experiences);
  console.log('WorkExperienceForm RENDER - experiences.length:', experiences.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-talendeur-primary" />
          Work Experience
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {experiences.map((exp, index) => (
          <Card key={index} className="border-2">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Job Title *</label>
                  <Input
                    value={exp.job_title}
                    onChange={(e) => updateExperience(index, 'job_title', e.target.value)}
                    placeholder="e.g., Senior Data Scientist"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Company *</label>
                  <Input
                    value={exp.company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    placeholder="e.g., Talendeur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={exp.start_date}
                    onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <Input
                    type="date"
                    value={exp.end_date}
                    onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                    disabled={exp.still_work_here}
                  />
                </div>

                <div className="col-span-full flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`current-${index}`}
                      checked={exp.still_work_here}
                      onCheckedChange={(checked) => updateExperience(index, 'still_work_here', checked as boolean)}
                    />
                    <label htmlFor={`current-${index}`} className="text-sm cursor-pointer">
                      I currently work here
                    </label>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeExperience(index)}
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
          onClick={addNewExperience}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Work Experience
        </Button>

        <div className="flex justify-end pt-4">
          <Button
            onClick={saveExperiences}
            disabled={saving}
            className="bg-gradient-to-r from-white via-talendeur-orange to-talendeur-primary hover:opacity-90 text-white"
          >
            {saving ? 'Saving...' : 'Save Work Experience'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
