import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Leaf, Users, Shield } from 'lucide-react';

interface ESGScores {
  environment_score: number;
  social_score: number;
  governance_score: number;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
  icon: typeof Leaf;
}

interface ESGChartProps {
  userId?: string;
  accessTokenOverride?: string | null;
}

export const ESGChart = ({ userId, accessTokenOverride }: ESGChartProps = {}) => {
  const { user, accessToken } = useAuth();
  const [esgData, setEsgData] = useState<ChartData[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchESG = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const effectiveUserId = userId ?? user?.id;
      const effectiveToken = accessTokenOverride !== undefined ? (accessTokenOverride || supabaseKey) : (accessToken || supabaseKey);
      if (!effectiveUserId) return;

      try {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/esg_scores?user_id=eq.${effectiveUserId}&select=*`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${effectiveToken}`,
            }
          }
        );
        const dataArray = await response.json();
        const data = dataArray[0];

        if (data) {
          const total = data.environment_score + data.social_score + data.governance_score;
          setTotalScore(total);

          const chartData: ChartData[] = [
            {
              name: 'Environmental',
              value: data.environment_score,
              color: '#9EBC9E',
              icon: Leaf
            },
            {
              name: 'Social',
              value: data.social_score,
              color: '#FFAFC5',
              icon: Users
            },
            {
              name: 'Governance',
              value: data.governance_score,
              color: '#553E4E',
              icon: Shield
            }
          ];

          setEsgData(chartData);
        }
      } catch (error) {
        // Silently handle - data just doesn't exist yet
      } finally {
        setLoading(false);
      }
    };

    fetchESG();
  }, [user, accessToken, userId, accessTokenOverride]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ESG Impact Profile</CardTitle>
          <CardDescription>Environmental, Social & Governance contributions</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading ESG data...</div>
        </CardContent>
      </Card>
    );
  }

  if (esgData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ESG Impact Profile</CardTitle>
          <CardDescription>Environmental, Social & Governance contributions</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          No ESG data available
        </CardContent>
      </Card>
    );
  }

  const renderCustomLabel = (entry: { percent: number }) => {
    return `${(entry.percent * 100).toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ESG Impact Profile</CardTitle>
        <CardDescription>
          Distribution of your contributions across sustainability dimensions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <div className="flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={esgData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {esgData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-4">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#9EBC9E] via-[#FFAFC5] to-[#553E4E]">
                {totalScore.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 font-medium">Total ESG Score</div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-4">
            {esgData.map((item) => {
              const Icon = item.icon;
              const percentage = totalScore > 0 ? (item.value / totalScore) * 100 : 0;
              
              return (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${item.color}15` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: item.color }} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.value.toFixed(1)}% of total impact
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold" style={{ color: item.color }}>
                      {item.value.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Impact Summary */}
            <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Impact Summary</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your volunteering activities show strong alignment with {esgData.sort((a, b) => b.value - a.value)[0].name.toLowerCase()} initiatives, 
                demonstrating commitment to sustainable and ethical practices.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
