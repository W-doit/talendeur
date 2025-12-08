import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SkillsDimensions {
  creativity: number;
  communication: number;
  critical_thinking: number;
  technology_development: number;
  operations: number;
  social_impact: number;
  business_acumen: number;
  innovation: number;
  collaboration: number;
  leadership: number;
  precision: number;
  depth: number;
  commitment: number;
  empathy: number;
  flexibility: number;
}

interface ChartDataPoint {
  skill: string;
  value: number;
}

export const SkillsRadarChart = () => {
  const { user } = useAuth();
  const [skillsData, setSkillsData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('skills_dimensions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Ignore "no rows" error - just means no data yet
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching skills dimensions:', error);
        }

        if (data) {
          // Transform data for radar chart
          const chartData = [
            { skill: 'Creativity', value: data.creativity },
            { skill: 'Communication', value: data.communication },
            { skill: 'Critical Thinking', value: data.critical_thinking },
            { skill: 'Tech Development', value: data.technology_development },
            { skill: 'Operations', value: data.operations },
            { skill: 'Social Impact', value: data.social_impact },
            { skill: 'Business Acumen', value: data.business_acumen },
            { skill: 'Innovation', value: data.innovation },
            { skill: 'Collaboration', value: data.collaboration },
            { skill: 'Leadership', value: data.leadership },
            { skill: 'Precision', value: data.precision },
            { skill: 'Depth', value: data.depth },
            { skill: 'Commitment', value: data.commitment },
            { skill: 'Empathy', value: data.empathy },
            { skill: 'Flexibility', value: data.flexibility },
          ];

          setSkillsData(chartData);
        }
      } catch (error) {
        // Silently handle - data just doesn't exist yet
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills Profile</CardTitle>
          <CardDescription>15-dimensional competency analysis</CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading skills data...</div>
        </CardContent>
      </Card>
    );
  }

  if (skillsData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills Profile</CardTitle>
          <CardDescription>15-dimensional competency analysis</CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] flex items-center justify-center">
          <div className="text-gray-500">No skills data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills Profile</CardTitle>
        <CardDescription>
          Comprehensive analysis across 15 key competency dimensions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={500}>
          <RadarChart data={skillsData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis 
              dataKey="skill" 
              tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fill: '#9ca3af', fontSize: 11 }}
            />
            <Radar
              name="Skills"
              dataKey="value"
              stroke="#D1163E"
              fill="#D1163E"
              fillOpacity={0.6}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              formatter={(value: number) => [`${value.toFixed(1)}`, 'Score']}
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Top Skills Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {skillsData
            .sort((a, b) => b.value - a.value)
            .slice(0, 3)
            .map((skill, index) => (
              <div 
                key={skill.skill} 
                className="text-center p-3 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200"
              >
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#E30F68]">
                  #{index + 1}
                </div>
                <div className="text-sm font-semibold text-gray-700 mt-1">{skill.skill}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{skill.value.toFixed(1)}</div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};
