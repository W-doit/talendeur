import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Helper function to normalize date formats
// Converts "2022-04" (year-month) to "2022-04-01" (full date)
// Returns null for empty/invalid dates
const normalizeDateFormat = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // If it's already a full date (YYYY-MM-DD), return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // If it's year-month only (YYYY-MM), append "-01"
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    return `${dateStr}-01`;
  }
  
  // If invalid format, return null
  console.warn(`Invalid date format: ${dateStr}`);
  return null;
};

interface Education {
  id?: string;
  institution: string;
  qualification_type: string;
  subject: string;
  location: string;
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

const QUALIFICATION_RANK: Record<string, number> = {
  PhD: 7,
  Master: 6,
  Bachelor: 5,
  Associate: 4,
  Diploma: 3,
  Certificate: 2,
  'High School': 1,
};

const normalizeQualificationType = (raw: string | undefined | null): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (QUALIFICATION_TYPES.includes(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  if (/ph\.?d|doctorate|doctoral|dphil/i.test(lower)) return 'PhD';
  if (/master|m\.?sc|mba|m\.?eng|m\.?phil|postgraduate/i.test(lower)) return 'Master';
  if (/bachelor|b\.?sc|b\.?eng|\bb\.?a\b|\bb\.?s\b|undergraduate|licen[cs]iatura|grado/i.test(lower)) return 'Bachelor';
  if (/associate/i.test(lower)) return 'Associate';
  if (/diploma/i.test(lower)) return 'Diploma';
  if (/high\s*school|secondary|a-?levels?|gcse/i.test(lower)) return 'High School';
  if (/certificate|certification/i.test(lower)) return 'Certificate';
  return '';
};

const getHighestQualification = (items: Education[]): string => {
  let best = '';
  let bestRank = 0;
  for (const edu of items) {
    const normalized = normalizeQualificationType(edu.qualification_type);
    const rank = QUALIFICATION_RANK[normalized] || 0;
    if (rank > bestRank) {
      bestRank = rank;
      best = normalized;
    }
  }
  return best;
};

interface EducationFormProps {
  importedData?: any[];
  onSaveComplete?: () => void;
  refreshKey?: number;
}

export const EducationForm = ({ importedData, onSaveComplete, refreshKey }: EducationFormProps = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [educations, setEducations] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataSource, setDataSource] = useState<'none' | 'imported' | 'database'>('none');

  // Reset dataSource when refreshKey changes to force re-fetch
  useEffect(() => {
    if (refreshKey !== undefined) {
      console.log('EducationForm - refreshKey changed, resetting data source');
      setDataSource('none');
    }
  }, [refreshKey]);

  // PRIORITY 1: Handle imported data first
  useEffect(() => {
    console.log('EducationForm - checking importedData:', importedData?.length);
    
    if (importedData && Array.isArray(importedData) && importedData.length > 0) {
      console.log('Pre-filling education with imported CV data:', importedData);
      const mappedData = importedData.map(edu => ({
        institution: edu.institution || '',
        qualification_type: normalizeQualificationType(
          edu.qualification_type || edu.degree || ''
        ) || (edu.qualification_type || edu.degree || ''),
        subject: edu.subject || edu.field || edu.major || '',
        location: edu.location || '',
        start_date: edu.start_date || edu.startDate || '',
        end_date: edu.end_date || edu.endDate || '',
        still_studying: edu.still_studying || false,
      }));
      console.log('Mapped education data:', mappedData);
      
      // Set imported data (replaces any existing data)
      setEducations(mappedData);
      setDataSource('imported');
      setLoading(false);
      
      console.log('Education data pre-filled from CV. User should review and save.');
    } else if (dataSource === 'imported') {
      // Reset when imported data is cleared
      console.log('Imported data cleared, will fetch from database');
      setDataSource('none');
    }
  }, [importedData, dataSource]);

  // PRIORITY 2: Fetch from database only if no imported data
  useEffect(() => {
    const fetchEducation = async () => {
      // Skip if we already have imported data or already fetched from database
      if (dataSource !== 'none') {
        console.log(`Skipping fetch - data source is: ${dataSource}`);
        return;
      }
      
      if (!user) {
        setLoading(false);
        return;
      }

      console.log('Fetching education from database...');

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
        
        const normalized = (data || []).map((edu) => ({
          ...edu,
          still_studying: !!edu.still_studying,
          end_date: edu.end_date ?? '',
        }));
        
        console.log(`Loaded ${normalized.length} education entries from database`);
        setEducations(normalized);
        setDataSource('database');
      } catch (error) {
        console.error('Error fetching education:', error);
        setEducations([]);
        setDataSource('database'); // Mark as attempted
      } finally {
        setLoading(false);
      }
    };

    fetchEducation();
  }, [user, dataSource]);

  const addNewEducation = () => {
    setEducations([
      ...educations,
      {
        institution: '',
        qualification_type: '',
        subject: '',
        location: '',
        start_date: '',
        end_date: '',
        still_studying: false,
      },
    ]);
  };

  const updateEducation = (index: number, field: keyof Education, value: string | boolean) => {
    const updated = [...educations];
    if (field === 'still_studying') {
      updated[index] = {
        ...updated[index],
        still_studying: value as boolean,
        end_date: value ? '' : updated[index].end_date,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setEducations(updated);
  };

  const setHighestQualificationOverride = (qualification: string) => {
    if (!qualification) return;

    const updated = [...educations];
    // Prefer updating an existing entry that already has this (or empty) type
    let targetIndex = updated.findIndex(
      (edu) => normalizeQualificationType(edu.qualification_type) === qualification
    );
    if (targetIndex === -1) {
      targetIndex = updated.findIndex((edu) => !edu.qualification_type);
    }
    if (targetIndex === -1 && updated.length > 0) {
      // Fall back to the most recent / first entry
      targetIndex = 0;
    }

    if (targetIndex === -1) {
      updated.push({
        institution: '',
        qualification_type: qualification,
        subject: '',
        location: '',
        start_date: '',
        end_date: '',
        still_studying: false,
      });
    } else {
      updated[targetIndex] = {
        ...updated[targetIndex],
        qualification_type: qualification,
      };
    }

    setEducations(updated);
    toast({
      title: 'Highest qualification set',
      description: `Set to ${qualification}. Review the education entry below, then save.`,
      duration: 3000,
    });
  };

  const derivedHighest = getHighestQualification(educations);

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
      // If we have imported data (no IDs), delete all existing entries first to avoid duplicates
      const hasNewImports = educations.some(edu => !edu.id && (edu.institution || edu.qualification_type));
      
      if (hasNewImports) {
        console.log('Detected imported data - deleting old education entries to avoid duplicates');
        const { error: deleteError } = await supabase
          .from('education_history')
          .delete()
          .eq('user_id', user.id);
        
        if (deleteError) {
          console.error('Error deleting old education:', deleteError);
          throw deleteError;
        }
      }

      const updatedEducations = [...educations];

      for (let index = 0; index < educations.length; index += 1) {
        const edu = educations[index];
        if (!edu.institution || !edu.qualification_type) continue;

        if (edu.id && !hasNewImports) {
          // Update existing (only if not replacing all with imports)
          const { error } = await supabase
            .from('education_history')
            .update({
              institution: edu.institution,
              qualification_type: edu.qualification_type,
              subject: edu.subject,
              location: edu.location || null,
              start_date: normalizeDateFormat(edu.start_date),
              end_date: edu.still_studying ? null : normalizeDateFormat(edu.end_date),
              still_studying: edu.still_studying,
            })
            .eq('id', edu.id);

          if (error) throw error;
        } else {
          // Insert new
          const { data, error } = await supabase
            .from('education_history')
            .insert({
              user_id: user.id,
              institution: edu.institution,
              qualification_type: edu.qualification_type,
              subject: edu.subject,
              location: edu.location || null,
              start_date: normalizeDateFormat(edu.start_date),
              end_date: edu.still_studying ? null : normalizeDateFormat(edu.end_date),
              still_studying: edu.still_studying,
            })
            .select('id')
            .single();

          if (error) throw error;

          updatedEducations[index] = { ...edu, id: data?.id };
        }
      }

      setEducations(updatedEducations);
      
      // After save, mark as database source (data is now persisted)
      setDataSource('database');
      
      toast({
        title: 'Education saved',
        description: 'Your education history has been updated successfully.',
        duration: 3000,
      });
      
      if (onSaveComplete) {
        onSaveComplete();
      }
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

  console.log('EducationForm RENDER - educations:', educations);
  console.log('EducationForm RENDER - educations.length:', educations.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-talendeur-primary" />
          Education
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-talendeur-primary/30 bg-talendeur-primary/5 p-4 space-y-2">
          <label className="block text-sm font-medium">
            Highest Qualification (shown on your profile dashboard)
          </label>
          <select
            value={derivedHighest}
            onChange={(e) => setHighestQualificationOverride(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-talendeur-primary bg-white"
          >
            <option value="" disabled>
              {derivedHighest ? 'Select qualification' : 'Not set — choose a qualification'}
            </option>
            {QUALIFICATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-600">
            If CV import left this blank, set it here. This updates an education entry below — remember to click Save.
          </p>
        </div>

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

                <div className="col-span-full">
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <Input
                    value={edu.location}
                    onChange={(e) => updateEducation(index, 'location', e.target.value)}
                    placeholder="e.g., Cambridge, UK"
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
            className="bg-talendeur-primary hover:bg-talendeur-primary-dark text-white"
          >
            {saving ? 'Saving...' : 'Save Education'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
