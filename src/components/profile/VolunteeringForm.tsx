import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, HeartHandshake } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const normalizeDateFormat = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`;
  if (/^\d{4}$/.test(dateStr)) return `${dateStr}-01-01`;
  return null;
};

const CAUSE_AREAS = ['Environmental', 'Social', 'Governance', 'Other'] as const;

interface VolunteeringEntry {
  id?: string;
  organization_name: string;
  role: string;
  cause_area: string;
  start_date: string;
  end_date: string;
  is_ongoing: boolean;
  hours_contributed: string;
  description: string;
}

interface VolunteeringFormProps {
  onSaveComplete?: () => void;
}

export const VolunteeringForm = ({ onSaveComplete }: VolunteeringFormProps = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<VolunteeringEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('volunteering')
          .select('*')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });
        if (error) throw error;
        setEntries(
          (data || []).map((row) => ({
            id: row.id,
            organization_name: row.organization_name || '',
            role: row.role || '',
            cause_area: row.cause_area || 'Social',
            start_date: row.start_date || '',
            end_date: row.end_date || '',
            is_ongoing: !!row.is_ongoing,
            hours_contributed: row.hours_contributed != null ? String(row.hours_contributed) : '',
            description: row.description || '',
          }))
        );
      } catch (error) {
        console.error('Error loading volunteering:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [user?.id]);

  const addEntry = () => {
    setEntries((prev) => [
      {
        organization_name: '',
        role: '',
        cause_area: 'Social',
        start_date: '',
        end_date: '',
        is_ongoing: false,
        hours_contributed: '',
        description: '',
      },
      ...prev,
    ]);
  };

  const updateEntry = (index: number, field: keyof VolunteeringEntry, value: string | boolean) => {
    setEntries((prev) => {
      const next = [...prev];
      if (field === 'is_ongoing') {
        next[index] = {
          ...next[index],
          is_ongoing: value as boolean,
          end_date: value ? '' : next[index].end_date,
        };
      } else {
        next[index] = { ...next[index], [field]: value as string };
      }
      return next;
    });
  };

  const removeEntry = async (index: number) => {
    const entry = entries[index];
    if (entry.id) {
      const { error } = await supabase.from('volunteering').delete().eq('id', entry.id);
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
      for (const entry of entries) {
        if (!entry.organization_name.trim()) continue;
        const payload = {
          organization_name: entry.organization_name.trim(),
          role: entry.role.trim() || null,
          cause_area: entry.cause_area || null,
          start_date: normalizeDateFormat(entry.start_date),
          end_date: entry.is_ongoing ? null : normalizeDateFormat(entry.end_date),
          is_ongoing: entry.is_ongoing,
          hours_contributed: entry.hours_contributed ? Number(entry.hours_contributed) : null,
          description: entry.description.trim() || null,
        };

        if (entry.id) {
          const { error } = await supabase.from('volunteering').update(payload).eq('id', entry.id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from('volunteering')
            .insert({ ...payload, user_id: user.id })
            .select('id')
            .single();
          if (error) throw error;
          entry.id = data.id;
        }
      }
      setEntries([...entries]);
      toast({ title: 'Volunteering saved' });
      onSaveComplete?.();
    } catch (error: any) {
      console.error('Error saving volunteering:', error);
      toast({
        title: 'Save failed',
        description: error.message || 'Could not save volunteering entries',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse text-muted-foreground p-4">Loading volunteering…</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <HeartHandshake className="h-5 w-5" />
          Volunteering Experience
        </CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Add volunteer roles to highlight impact work (also feeds your ESG chart).
          </p>
        )}
        {entries.map((entry, index) => (
          <div key={entry.id || index} className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => removeEntry(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Organization</Label>
                <Input
                  value={entry.organization_name}
                  onChange={(e) => updateEntry(index, 'organization_name', e.target.value)}
                  placeholder="e.g., Red Cross"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Input
                  value={entry.role}
                  onChange={(e) => updateEntry(index, 'role', e.target.value)}
                  placeholder="e.g., Volunteer Coordinator"
                />
              </div>
              <div>
                <Label>Cause area</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={entry.cause_area}
                  onChange={(e) => updateEntry(index, 'cause_area', e.target.value)}
                >
                  {CAUSE_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Hours contributed</Label>
                <Input
                  type="number"
                  min={0}
                  value={entry.hours_contributed}
                  onChange={(e) => updateEntry(index, 'hours_contributed', e.target.value)}
                  placeholder="e.g., 40"
                />
              </div>
              <div>
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={(entry.start_date || '').slice(0, 10)}
                  onChange={(e) => updateEntry(index, 'start_date', e.target.value)}
                />
              </div>
              <div>
                <Label>End date</Label>
                <Input
                  type="date"
                  disabled={entry.is_ongoing}
                  value={(entry.end_date || '').slice(0, 10)}
                  onChange={(e) => updateEntry(index, 'end_date', e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`ongoing-vol-${index}`}
                checked={entry.is_ongoing}
                onCheckedChange={(checked) => updateEntry(index, 'is_ongoing', checked === true)}
              />
              <Label htmlFor={`ongoing-vol-${index}`}>Ongoing</Label>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={entry.description}
                onChange={(e) => updateEntry(index, 'description', e.target.value)}
                placeholder="What you did and the impact"
              />
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <Button type="button" onClick={saveEntries} disabled={saving}>
            {saving ? 'Saving…' : 'Save Volunteering'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
