import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Reference {
  id?: string;
  relationship: string;
  email: string;
  number: number | string;
}

export const ReferencesForm = () => {
  const { user } = useAuth();
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchReferences = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reference')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setReferences(data || []);
    } catch (error) {
      console.error('Error fetching references:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReferences();
  }, [fetchReferences]);

  const addNewReference = () => {
    setReferences([
      ...references,
      {
        relationship: '',
        email: '',
        number: '',
      },
    ]);
  };

  const updateReference = (index: number, field: keyof Reference, value: string | number) => {
    const updated = [...references];
    updated[index] = { ...updated[index], [field]: value };
    setReferences(updated);
  };

  const removeReference = async (index: number) => {
    const reference = references[index];
    
    if (reference.id) {
      try {
        const { error } = await supabase
          .from('reference')
          .delete()
          .eq('id', reference.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting reference:', error);
        return;
      }
    }

    const updated = references.filter((_, i) => i !== index);
    setReferences(updated);
  };

  const saveReferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      for (const ref of references) {
        if (!ref.relationship || !ref.email) continue;

        if (ref.id) {
          const { error } = await supabase
            .from('reference')
            .update({
              relationship: ref.relationship,
              email: ref.email,
              number: ref.number ? Number(ref.number) : null,
            })
            .eq('id', ref.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('reference')
            .insert({
              user_id: user.id,
              relationship: ref.relationship,
              email: ref.email,
              number: ref.number ? Number(ref.number) : null,
            });

          if (error) throw error;
        }
      }

      await fetchReferences();
    } catch (error) {
      console.error('Error saving references:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading references...</div>;
  }

  if (!user) {
    return <div className="text-center py-4 text-muted-foreground">Please log in to manage your references.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-talendeur-primary" />
          References
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {references.map((ref, index) => (
          <Card key={index} className="border-2">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Relationship *</label>
                  <Input
                    value={ref.relationship}
                    onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                    placeholder="e.g., Former Manager, Professor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <Input
                    type="email"
                    value={ref.email}
                    onChange={(e) => updateReference(index, 'email', e.target.value)}
                    placeholder="reference@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <Input
                    type="tel"
                    value={ref.number}
                    onChange={(e) => updateReference(index, 'number', e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>

                <div className="col-span-full flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeReference(index)}
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
          onClick={addNewReference}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Reference
        </Button>

        <div className="flex justify-end pt-4">
          <Button
            onClick={saveReferences}
            disabled={saving}
            className="bg-talendeur-primary hover:bg-talendeur-primary-dark"
          >
            {saving ? 'Saving...' : 'Save References'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
