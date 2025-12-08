import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { Brain } from 'lucide-react';

interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

interface ChartData {
  trait: string;
  score: number;
  fullMark: 100;
  color: string;
  description: string;
}

const TRAIT_INFO = {
  openness: {
    color: '#FF9F14',
    description: 'Imagination, curiosity, and openness to new experiences'
  },
  conscientiousness: {
    color: '#D1163E',
    description: 'Organization, responsibility, and self-discipline'
  },
  extraversion: {
    color: '#E30F68',
    description: 'Sociability, assertiveness, and energetic behavior'
  },
  agreeableness: {
    color: '#10B981',
    description: 'Compassion, cooperation, and trust in others'
  },
  neuroticism: {
    color: '#180D51',
    description: 'Emotional stability and tendency toward negative emotions'
  },
};

export const PersonalityVisualization = () => {
  const { user } = useAuth();
  const [traits, setTraits] = useState<PersonalityTraits | null>(null);
  const [facets, setFacets] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPersonalityData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch personality traits
      const { data: traitsData, error: traitsError } = await supabase
        .from('personality_traits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (traitsError) {
        console.error('Error fetching traits:', traitsError);
      }

      if (traitsData) {
        setTraits(traitsData);

        // Fetch facets using the personality_trait_id
        const { data: facetsData, error: facetsError } = await supabase
          .from('personality_facets')
          .select('*')
          .eq('personality_trait_id', traitsData.id)
          .maybeSingle();

        if (facetsError) {
          console.error('Error fetching facets:', facetsError);
        }

        if (facetsData) {
          setFacets(facetsData);
        }
      }
    } catch (error) {
      console.error('Error fetching personality data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPersonalityData();
  }, [fetchPersonalityData]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-talendeur-primary" />
            Personality Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading personality data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!traits) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-talendeur-primary" />
            Personality Profile
          </CardTitle>
          <CardDescription>
            Complete the personality assessment to see your Big Five profile
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          No personality data available. Take the test in the Edit Profile section.
        </CardContent>
      </Card>
    );
  }

  const radarData: ChartData[] = [
    {
      trait: 'Openness',
      score: Number(traits.openness) || 0,
      fullMark: 100,
      color: TRAIT_INFO.openness.color,
      description: TRAIT_INFO.openness.description,
    },
    {
      trait: 'Conscientiousness',
      score: Number(traits.conscientiousness) || 0,
      fullMark: 100,
      color: TRAIT_INFO.conscientiousness.color,
      description: TRAIT_INFO.conscientiousness.description,
    },
    {
      trait: 'Extraversion',
      score: Number(traits.extraversion) || 0,
      fullMark: 100,
      color: TRAIT_INFO.extraversion.color,
      description: TRAIT_INFO.extraversion.description,
    },
    {
      trait: 'Agreeableness',
      score: Number(traits.agreeableness) || 0,
      fullMark: 100,
      color: TRAIT_INFO.agreeableness.color,
      description: TRAIT_INFO.agreeableness.description,
    },
    {
      trait: 'Neuroticism',
      score: 100 - (Number(traits.neuroticism) || 0), // Invert for display (higher = more stable)
      fullMark: 100,
      color: TRAIT_INFO.neuroticism.color,
      description: 'Emotional stability (inverted)',
    },
  ];

  // Get top facets - filter out non-numeric fields and ensure valid numbers
  const topFacets = facets ? Object.entries(facets)
    .filter(([key, value]) => {
      // Exclude ID fields, timestamps, and check if value is a valid number
      return !['id', 'personality_trait_id', 'user_id', 'created_at', 'updated_at'].includes(key) 
        && typeof value === 'number' 
        && !isNaN(value);
    })
    .map(([key, value]) => ({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      score: value as number
    }))
    .filter(item => item.score > 0) // Only show facets with positive scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 6) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-talendeur-primary" />
          Big Five Personality Profile
        </CardTitle>
        <CardDescription>
          Your personality traits based on the OCEAN model
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Radar Chart */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Trait Overview</h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="trait" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Radar
                  name="Personality"
                  dataKey="score"
                  stroke="#D1163E"
                  fill="#D1163E"
                  fillOpacity={0.5}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Trait Scores */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Detailed Scores</h3>
            {radarData.map((item) => (
              <div key={item.trait} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900">{item.trait}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: item.color }}>
                    {item.score.toFixed(0)}%
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${item.score}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Facets Bar Chart */}
        {topFacets.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Strongest Personality Facets</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topFacets} layout="vertical">
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                  {topFacets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(TRAIT_INFO)[index % 5].color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
