import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Languages as LanguagesIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const PROFICIENCIES = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'] as const;
const LANGUAGE_TYPES = [
  { value: 'spoken', label: 'Spoken / human' },
  { value: 'programming', label: 'Programming / technical' },
] as const;

export interface LanguageEntry {
  id?: string;
  language: string;
  proficiency: string;
  language_type: 'spoken' | 'programming';
}

interface LanguagesFormProps {
  importedData?: Array<{ language?: string; proficiency?: string; language_type?: string }>;
  onSaveComplete?: () => void;
}

export const LanguagesForm = ({ importedData, onSaveComplete }: LanguagesFormProps = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<LanguageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (importedData && importedData.length > 0) {
      setEntries(
        importedData.map((lang) => ({
          language: lang.language || '',
          proficiency: lang.proficiency || 'Intermediate',
          language_type:
            lang.language_type === 'programming' ? 'programming' : 'spoken',
        }))
      );
      setLoading(false);
      return;
    }

    const fetchEntries = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('languages')
          .select('*')
          .eq('user_id', user.id)
          .order('language_type')
          .order('language');
        if (error) throw error;
        setEntries(
          (data || []).map((row) => ({
            id: row.id,
            language: row.language || '',
            proficiency: row.proficiency || 'Intermediate',
            language_type: row.language_type === 'programming' ? 'programming' : 'spoken',
          }))
        );
      } catch (error) {
        console.error('Error loading languages:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [user?.id, importedData]);

  const addEntry = (type: 'spoken' | 'programming' = 'spoken') => {
    setEntries((prev) => [
      { language: '', proficiency: 'Intermediate', language_type: type },
      ...prev,
    ]);
  };

  const updateEntry = (index: number, field: keyof LanguageEntry, value: string) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value } as LanguageEntry;
      return next;
    });
  };

  const removeEntry = async (index: number) => {
    const entry = entries[index];
    if (entry.id) {
      const { error } = await supabase.from('languages').delete().eq('id', entry.id);
      if (error) {
        toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
        return;
      }
    }
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const saveEntries = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const valid = entries.filter((e) => e.language.trim());
      const { error: deleteError } = await supabase.from('languages').delete().eq('user_id', user.id);
      if (deleteError) throw deleteError;

      if (valid.length > 0) {
        const { data, error } = await supabase
          .from('languages')
          .insert(
            valid.map((e) => ({
              user_id: user.id,
              language: e.language.trim(),
              proficiency: e.proficiency || 'Intermediate',
              language_type: e.language_type,
            }))
          )
          .select('id, language, proficiency, language_type');
        if (error) throw error;
        setEntries(
          (data || []).map((row) => ({
            id: row.id,
            language: row.language,
            proficiency: row.proficiency,
            language_type: row.language_type === 'programming' ? 'programming' : 'spoken',
          }))
        );
      } else {
        setEntries([]);
      }

      toast({ title: 'Languages saved' });
      onSaveComplete?.();
    } catch (error: any) {
      console.error('Error saving languages:', error);
      toast({
        title: 'Save failed',
        description: error.message || 'Could not save languages',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse text-muted-foreground p-4">Loading languages…</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <LanguagesIcon className="h-5 w-5" />
          Languages
        </CardTitle>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => addEntry('spoken')}>
            <Plus className="h-4 w-4 mr-1" />
            Spoken
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addEntry('programming')}>
            <Plus className="h-4 w-4 mr-1" />
            Programming
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Add spoken languages and programming languages — both appear on your profile front page.
        </p>
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No languages yet.</p>
        )}
        {entries.map((entry, index) => (
          <div key={entry.id || index} className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted-foreground uppercase">
                {entry.language_type === 'programming' ? 'Programming' : 'Spoken'}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeEntry(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Language</Label>
                <Input
                  value={entry.language}
                  onChange={(e) => updateEntry(index, 'language', e.target.value)}
                  placeholder={entry.language_type === 'programming' ? 'e.g., Python' : 'e.g., Spanish'}
                />
              </div>
              <div>
                <Label>Proficiency</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={entry.proficiency}
                  onChange={(e) => updateEntry(index, 'proficiency', e.target.value)}
                >
                  {PROFICIENCIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Type</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={entry.language_type}
                  onChange={(e) => updateEntry(index, 'language_type', e.target.value)}
                >
                  {LANGUAGE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <Button type="button" onClick={saveEntries} disabled={saving}>
            {saving ? 'Saving…' : 'Save Languages'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
