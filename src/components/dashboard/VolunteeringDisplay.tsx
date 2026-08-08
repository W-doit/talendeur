import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { HeartHandshake } from 'lucide-react';

interface VolunteeringRow {
  id: string;
  organization_name: string;
  role: string | null;
  cause_area: string | null;
  start_date: string | null;
  end_date: string | null;
  is_ongoing: boolean | null;
  hours_contributed: number | null;
  description: string | null;
}

interface VolunteeringDisplayProps {
  userId?: string;
  accessTokenOverride?: string | null;
}

export const VolunteeringDisplay = ({
  userId,
  accessTokenOverride,
}: VolunteeringDisplayProps = {}) => {
  const { user, accessToken } = useAuth();
  const [entries, setEntries] = useState<VolunteeringRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      const effectiveUserId = userId ?? user?.id;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const effectiveToken =
        accessTokenOverride !== undefined
          ? accessTokenOverride || supabaseKey
          : accessToken || supabaseKey;

      if (!effectiveUserId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/volunteering?user_id=eq.${effectiveUserId}&select=*&order=start_date.desc.nullslast`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${effectiveToken}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setEntries(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error loading volunteering:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [user, accessToken, userId, accessTokenOverride]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Volunteering</CardTitle>
        </CardHeader>
        <CardContent className="animate-pulse text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  if (entries.length === 0) return null;

  const formatRange = (row: VolunteeringRow) => {
    const start = row.start_date
      ? new Date(row.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : '';
    const end = row.is_ongoing
      ? 'Present'
      : row.end_date
        ? new Date(row.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : '';
    return [start, end].filter(Boolean).join(' – ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartHandshake className="h-5 w-5" />
          Volunteering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="border-l-4 border-talendeur-primary/40 pl-3">
            <p className="font-semibold text-sm">{entry.role || 'Volunteer'}</p>
            <p className="text-sm text-gray-700">{entry.organization_name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {[entry.cause_area, formatRange(entry), entry.hours_contributed != null ? `${entry.hours_contributed} hrs` : '']
                .filter(Boolean)
                .join(' · ')}
            </p>
            {entry.description && (
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{entry.description}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
