import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Building2 } from 'lucide-react';

interface CareerPreferencesDisplayProps {
  openToRelocation?: boolean;
  targetOrganizations?: string[];
}

export const CareerPreferencesDisplay = ({
  openToRelocation,
  targetOrganizations = [],
}: CareerPreferencesDisplayProps) => {
  const orgs = targetOrganizations.filter((o) => o.trim());
  if (!openToRelocation && orgs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Career preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {openToRelocation && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-talendeur-primary" />
            <span className="font-medium">Open to relocation</span>
          </div>
        )}
        {orgs.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              Looking to connect with
            </p>
            <div className="flex flex-wrap gap-2">
              {orgs.map((org) => (
                <span
                  key={org}
                  className="px-3 py-1 rounded-full bg-talendeur-orange/10 text-talendeur-orange text-sm"
                >
                  {org}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/** Small helper used when preferences are loaded async from profile row */
export const useCareerPreferencesFromProfile = (
  userId?: string,
  accessTokenOverride?: string | null
) => {
  const [openToRelocation, setOpenToRelocation] = useState(false);
  const [targetOrganizations, setTargetOrganizations] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const token = accessTokenOverride !== undefined ? accessTokenOverride || supabaseKey : supabaseKey;
      try {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/profile?user_id=eq.${userId}&select=open_to_relocation,target_organizations`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) return;
        const rows = await response.json();
        const row = rows?.[0];
        if (!row) return;
        setOpenToRelocation(!!row.open_to_relocation);
        setTargetOrganizations(Array.isArray(row.target_organizations) ? row.target_organizations : []);
      } catch {
        // columns may not exist yet
      }
    };
    load();
  }, [userId, accessTokenOverride]);

  return { openToRelocation, targetOrganizations };
};
