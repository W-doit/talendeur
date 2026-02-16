import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Award } from 'lucide-react';

interface Certification {
  id: string;
  course_name: string;
  certification_type: string;
  date_attained: string;
  details: string;
}

interface CategoryCount {
  category: string;
  count: number;
  color: string;
}

interface CertificationsChartProps {
  userId?: string;
  accessTokenOverride?: string | null;
}

export const CertificationsChart = ({ userId, accessTokenOverride }: CertificationsChartProps = {}) => {
  const { user, accessToken } = useAuth();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const COLORS = ['#9EBC9E', '#CFC6B8', '#FFCFD2', '#FFAFC5', '#AA778A', '#553E4E'];
    
    const fetchCertifications = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const effectiveUserId = userId ?? user?.id;
      const effectiveToken = accessTokenOverride !== undefined ? (accessTokenOverride || supabaseKey) : (accessToken || supabaseKey);
      if (!effectiveUserId) return;

      try {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/certifications?user_id=eq.${effectiveUserId}&select=*&order=date_attained.desc`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${effectiveToken}`,
            }
          }
        );
        const data = await response.json();

        if (data) {
          setCertifications(data);

          const categoryCounts: Record<string, number> = {};
          data.forEach(cert => {
            const category = cert.certification_type || 'Other';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          });

          const chartData = Object.entries(categoryCounts)
            .map(([category, count], index) => ({
              category,
              count,
              color: COLORS[index % COLORS.length]
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          setCategoryData(chartData);
        }
      } catch (error) {
        console.error('Error fetching certifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertifications();
  }, [user, accessToken, userId, accessTokenOverride]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Professional Certifications</CardTitle>
          <CardDescription>Credentials and qualifications by category</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading certifications...</div>
        </CardContent>
      </Card>
    );
  }

  if (certifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Professional Certifications</CardTitle>
          <CardDescription>Credentials and qualifications by category</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          No certifications added yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Certifications</CardTitle>
        <CardDescription>
          {certifications.length} certification{certifications.length !== 1 ? 's' : ''} across {categoryData.length} categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Bar Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="category" 
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              formatter={(value: number) => [`${value} certification${value !== 1 ? 's' : ''}`, 'Count']}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Recent Certifications List */}
        <div className="mt-8">
          <h4 className="font-semibold text-sm text-gray-700 mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Recent Certifications
          </h4>
          <div className="space-y-3">
            {certifications.slice(0, 5).map((cert) => {
              const colors = ['#9EBC9E', '#CFC6B8', '#FFCFD2', '#FFAFC5', '#AA778A', '#553E4E'];
              const colorIndex = certifications.indexOf(cert) % colors.length;
              return (
                <div 
                  key={cert.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: colors[colorIndex] }}
                      ></div>
                      <h5 className="font-semibold text-sm text-gray-900">{cert.course_name}</h5>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-4">{cert.details}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4">
                    <span className="px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full whitespace-nowrap">
                      {cert.certification_type}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(cert.date_attained).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
