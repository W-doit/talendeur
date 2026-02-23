import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Users, ExternalLink } from 'lucide-react';

interface Reference {
  id: string;
  name: string | null;
  nature_of_reference: string | null;
  year_worked_known: string | null;
  linkedin_profile: string | null;
}

interface ReferencesDisplayProps {
  userId?: string;
  accessTokenOverride?: string | null;
}

export const ReferencesDisplay = ({ userId, accessTokenOverride }: ReferencesDisplayProps = {}) => {
  const { user, accessToken } = useAuth();
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferences = async () => {
      if (!user || !accessToken) {
        setLoading(false);
        return;
      }

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        const response = await fetch(
          `${supabaseUrl}/rest/v1/reference?user_id=eq.${user.id}&select=*`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setReferences(data || []);
        }
      } catch (error) {
        console.error('Error fetching references:', error);
        setReferences([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReferences();
  }, [user, accessToken, userId, accessTokenOverride]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-talendeur-primary" />
            References
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (references.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-talendeur-primary" />
            References
          </CardTitle>
          <CardDescription>Professional references and contacts</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          No references added yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-talendeur-primary" />
          References
        </CardTitle>
        <CardDescription>
          {references.length} professional reference{references.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {references.map((ref) => (
            <div
              key={ref.id}
              className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50/50 to-white hover:shadow-md transition-shadow"
            >
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-gray-900">{ref.name || 'Unnamed Reference'}</h3>
                
                {ref.nature_of_reference && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Nature: </span>
                    {ref.nature_of_reference}
                  </p>
                )}

                {ref.year_worked_known && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Year Known: </span>
                    {ref.year_worked_known}
                  </p>
                )}

                {ref.linkedin_profile && (
                  <a
                    href={ref.linkedin_profile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline mt-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    LinkedIn Profile
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
