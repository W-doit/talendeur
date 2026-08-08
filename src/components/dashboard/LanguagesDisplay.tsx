import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Languages as LanguagesIcon } from 'lucide-react';

interface LanguageRow {
  language: string;
  proficiency: string;
  language_type: string;
}

interface LanguagesDisplayProps {
  userId?: string;
  accessTokenOverride?: string | null;
}

export const LanguagesDisplay = ({ userId, accessTokenOverride }: LanguagesDisplayProps = {}) => {
  const { user, accessToken } = useAuth();
  const [languages, setLanguages] = useState<LanguageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLanguages = async () => {
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
          `${supabaseUrl}/rest/v1/languages?user_id=eq.${effectiveUserId}&select=language,proficiency,language_type&order=language_type.asc,language.asc`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${effectiveToken}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setLanguages(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error loading languages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, [user, accessToken, userId, accessTokenOverride]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LanguagesIcon className="h-5 w-5" />
            Languages
          </CardTitle>
        </CardHeader>
        <CardContent className="animate-pulse text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  if (languages.length === 0) return null;

  const spoken = languages.filter((l) => l.language_type !== 'programming');
  const programming = languages.filter((l) => l.language_type === 'programming');

  return (
    <Card className="border-talendeur-primary/20 bg-gradient-to-br from-talendeur-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LanguagesIcon className="h-5 w-5 text-talendeur-primary" />
          Languages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {spoken.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Spoken
            </p>
            <div className="flex flex-wrap gap-2">
              {spoken.map((lang) => (
                <span
                  key={`spoken-${lang.language}`}
                  className="inline-flex items-center gap-2 rounded-full bg-talendeur-primary/10 px-3 py-1.5 text-sm text-talendeur-primary"
                >
                  <span className="font-medium">{lang.language}</span>
                  <span className="text-xs opacity-70">{lang.proficiency}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        {programming.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Programming
            </p>
            <div className="flex flex-wrap gap-2">
              {programming.map((lang) => (
                <span
                  key={`prog-${lang.language}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#553E4E]/10 px-3 py-1.5 text-sm text-[#553E4E]"
                >
                  <span className="font-medium">{lang.language}</span>
                  <span className="text-xs opacity-70">{lang.proficiency}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
