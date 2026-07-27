import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, Briefcase, TrendingUp, Award } from 'lucide-react';

interface ProfileMetrics {
  highest_qualification: string;
  total_years_experience: number;
  avg_years_per_job: number;
  total_jobs: number;
  total_companies: number;
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
        const headers = {
          apikey: supabaseKey,
          Authorization: `Bearer ${effectiveToken}`,
        };

        // Fetch work experience and education in parallel
        const [workExpResponse, educationResponse] = await Promise.all([
          fetch(
            `${supabaseUrl}/rest/v1/work_experience?user_id=eq.${effectiveUserId}&select=*`,
            { headers }
          ),
          fetch(
            `${supabaseUrl}/rest/v1/education_history?user_id=eq.${effectiveUserId}&select=qualification_type`,
            { headers }
          ),
        ]);

        const workExp = workExpResponse.ok ? await workExpResponse.json() : [];
        const education = educationResponse.ok ? await educationResponse.json() : [];

        // Rank qualification types (must match EducationForm options)
        const degreeHierarchy: Record<string, number> = {
          PhD: 7,
          Master: 6,
          Bachelor: 5,
          Associate: 4,
          Diploma: 3,
          Certificate: 2,
          'High School': 1,
        };

        const normalizeQualification = (raw: string): string | null => {
          const q = raw.trim();
          if (!q) return null;
          const lower = q.toLowerCase();
          if (lower.includes('phd') || lower.includes('doctorate') || lower.includes('doctoral')) return 'PhD';
          if (lower.includes('master')) return 'Master';
          if (lower.includes('bachelor')) return 'Bachelor';
          if (lower.includes('associate')) return 'Associate';
          if (lower.includes('diploma')) return 'Diploma';
          if (lower.includes('certificate') || lower.includes('certification')) return 'Certificate';
          if (lower.includes('high school') || lower.includes('secondary')) return 'High School';
          if (degreeHierarchy[q] !== undefined) return q;
          return null;
        };

        const displayLabels: Record<string, string> = {
          PhD: 'PhD',
          Master: "Master's Degree",
          Bachelor: "Bachelor's Degree",
          Associate: 'Associate Degree',
          Diploma: 'Diploma',
          Certificate: 'Certificate',
          'High School': 'High School',
        };

        let highestDegree = 'Not specified';
        if (Array.isArray(education) && education.length > 0) {
          let bestType = '';
          let bestRank = 0;
          for (const curr of education) {
            const normalized = normalizeQualification(curr.qualification_type || '');
            if (!normalized) continue;
            const rank = degreeHierarchy[normalized] || 0;
            if (rank > bestRank) {
              bestRank = rank;
              bestType = normalized;
            }
          }
          if (bestType) {
            highestDegree = displayLabels[bestType] || bestType;
          }
        }

        // Calculate experience by company tenure (not per role)
        type WorkRow = {
          company: string | null;
          start_date: string;
          end_date: string | null;
          still_work_here?: boolean;
        };

        const companyTenures = new Map<string, { start: number; end: number }>();
        if (Array.isArray(workExp) && workExp.length > 0) {
          for (const job of workExp as WorkRow[]) {
            if (!job.start_date) continue;
            const companyKey = (job.company || 'Unknown').trim().toLowerCase() || 'unknown';
            const start = new Date(job.start_date).getTime();
            const end =
              job.end_date && !job.still_work_here
                ? new Date(job.end_date).getTime()
                : Date.now();

            const existing = companyTenures.get(companyKey);
            if (!existing) {
              companyTenures.set(companyKey, { start, end });
            } else {
              companyTenures.set(companyKey, {
                start: Math.min(existing.start, start),
                end: Math.max(existing.end, end),
              });
            }
          }
        }

        const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
        const tenureYears = Array.from(companyTenures.values()).map(
          ({ start, end }) => Math.max(0, (end - start) / msPerYear)
        );
        const totalYears = tenureYears.reduce((sum, y) => sum + y, 0);
        const avgYears = tenureYears.length > 0 ? totalYears / tenureYears.length : 0;

        setMetrics({
          highest_qualification: highestDegree,
          total_years_experience: Math.round(totalYears * 10) / 10,
          avg_years_per_job: Math.round(avgYears * 10) / 10,
          total_jobs: workExp?.length || 0,
          total_companies: companyTenures.size,
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
            Avg. Tenure per Company
          </CardTitle>
          <TrendingUp className="h-5 w-5 text-[#FFCFD2]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.avg_years_per_job} years
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Across {metrics.total_companies} {metrics.total_companies === 1 ? 'company' : 'companies'}
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
