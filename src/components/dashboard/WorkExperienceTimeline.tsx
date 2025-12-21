import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, Calendar, MapPin } from 'lucide-react';

interface WorkExperience {
  id: string;
  job_title: string;
  company: string;
  start_date: string;
  end_date: string | null;
  still_work_here: boolean;
}

export const WorkExperienceTimeline = () => {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExperiences = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('work_experience')
          .select('*')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });

        if (error) throw error;
        setExperiences(data || []);
      } catch (error) {
        console.error('Error fetching work experience:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const calculateDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    } else if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    } else {
      return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Career Timeline</CardTitle>
          <CardDescription>Professional journey and work history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (experiences.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Career Timeline</CardTitle>
          <CardDescription>Professional journey and work history</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          No work experience added yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Career Timeline</CardTitle>
        <CardDescription>
          {experiences.length} position{experiences.length !== 1 ? 's' : ''} spanning your professional journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#9EBC9E] via-[#FFAFC5] to-[#AA778A]"></div>

          {/* Timeline items */}
          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <div key={exp.id} className="relative pl-16">
                {/* Timeline dot */}
                <div className={`absolute left-3 w-6 h-6 rounded-full border-4 border-white shadow-md ${
                  exp.still_work_here 
                    ? 'bg-gradient-to-br from-[#9EBC9E] to-[#FFAFC5] animate-pulse' 
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  {exp.still_work_here && (
                    <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75"></div>
                  )}
                </div>

                {/* Content card */}
                <div className={`rounded-lg border p-4 transition-all hover:shadow-lg ${
                  exp.still_work_here 
                    ? 'bg-gradient-to-br from-[#9EBC9E]/5 to-[#FFAFC5]/5 border-[#9EBC9E]/20' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-gray-900">{exp.job_title}</h3>
                        {exp.still_work_here && (
                          <span className="px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-[#9EBC9E] to-[#FFAFC5] rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <Briefcase className="h-4 w-4" />
                        <span className="font-medium">{exp.company}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(exp.start_date)} - {exp.still_work_here ? 'Present' : formatDate(exp.end_date!)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-[#AA778A]">
                            {calculateDuration(exp.start_date, exp.end_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
