import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, Briefcase, TrendingUp, Award } from 'lucide-react';

interface ProfileMetrics {
  highest_qualification: string;
  total_years_experience: number;
  avg_years_per_job: number;
  total_jobs: number;
}

interface KeyMetricsCardsProps {
  userId?: string;
  accessTokenOverride?: string | null;
}

export const KeyMetricsCards = ({ userId, accessTokenOverride }: KeyMetricsCardsProps = {}) => {
  const { user, accessToken } = useAuth();
  const [metrics, setMetrics] = useState<ProfileMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const effectiveUserId = userId ?? user?.id;
      const effectiveToken = accessTokenOverride !== undefined ? (accessTokenOverride || supabaseKey) : (accessToken || supabaseKey);
      if (!effectiveUserId) return;

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const authHeader = `Bearer ${accessToken}`;
        
        // Fetch work experience via REST API
        const workExpResponse = await fetch(
          `${supabaseUrl}/rest/v1/work_experience?user_id=eq.${user.id}&select=*`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': authHeader,
            }
          }
        );
        const workExp = await workExpResponse.json();

        // Fetch education via REST API
        const educationResponse = await fetch(
          `${supabaseUrl}/rest/v1/education?user_id=eq.${effectiveUserId}&select=degree`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': authHeader,
            }
          }
        );
        const education = await educationResponse.json();

        // Calculate highest qualification
        const degreeHierarchy = { 'PhD': 4, 'Master': 3, 'Bachelor': 2, 'Certificate': 1 };
        let highestDegree = 'No Degree';
        if (education && education.length > 0) {
          const maxDegree = education.reduce((max, curr) => {
            const currRank = degreeHierarchy[curr.degree as keyof typeof degreeHierarchy] || 0;
            const maxRank = degreeHierarchy[max as keyof typeof degreeHierarchy] || 0;
            return currRank > maxRank ? curr.degree : max;
          }, '');
          
          if (maxDegree === 'Master') highestDegree = "Master's Degree";
          else if (maxDegree === 'Bachelor') highestDegree = "Bachelor's Degree";
          else highestDegree = maxDegree;
        }

        // Calculate years of experience
        let totalYears = 0;
        if (workExp && workExp.length > 0) {
          workExp.forEach(job => {
            const startDate = new Date(job.start_date);
            const endDate = job.end_date ? new Date(job.end_date) : new Date();
            const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            totalYears += years;
          });
        }

        const avgYears = workExp && workExp.length > 0 ? totalYears / workExp.length : 0;

        setMetrics({
          highest_qualification: highestDegree,
          total_years_experience: Math.round(totalYears * 10) / 10,
          avg_years_per_job: Math.round(avgYears * 10) / 10,
          total_jobs: workExp?.length || 0
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user, accessToken, userId, accessTokenOverride]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-l-4 border-l-[#9EBC9E] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Highest Qualification
          </CardTitle>
          <GraduationCap className="h-5 w-5 text-[#9EBC9E]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.highest_qualification}
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-[#CFC6B8] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Experience
          </CardTitle>
          <Briefcase className="h-5 w-5 text-[#CFC6B8]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.total_years_experience} years
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Across {metrics.total_jobs} positions
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-[#FFCFD2] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Avg. Years per Job
          </CardTitle>
          <TrendingUp className="h-5 w-5 text-[#FFCFD2]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.avg_years_per_job} years
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Job stability indicator
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-[#553E4E] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Career Positions
          </CardTitle>
          <Award className="h-5 w-5 text-[#553E4E]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.total_jobs}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Total roles held
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
