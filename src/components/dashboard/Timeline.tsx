import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, Calendar, GraduationCap } from 'lucide-react';

type TimelineEventType = 'work' | 'education';

interface WorkExperience {
  id: string;
  job_title: string;
  company: string;
  start_date: string | null;
  end_date: string | null;
  still_work_here: boolean | null;
}

interface EducationHistory {
  id: string;
  institution: string | null;
  qualification_type: string | null;
  subject: string | null;
  start_date: string | null;
  end_date: string | null;
  still_studying: boolean | null;
}

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  subtitle?: string;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
  meta?: string;
  sortDate?: string | null;
}

interface TimelineProps {
  userId?: string;
  accessTokenOverride?: string | null;
  refreshTrigger?: number;
}

export const Timeline = ({ userId, accessTokenOverride, refreshTrigger }: TimelineProps = {}) => {
  const { user, accessToken } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const effectiveUserId = userId ?? user?.id;
      const effectiveToken = accessTokenOverride !== undefined ? (accessTokenOverride || supabaseKey) : (accessToken || supabaseKey);
      if (!effectiveUserId) {
        setLoading(false);
        return;
      }

      try {
        const headers = {
          apikey: supabaseKey,
          Authorization: `Bearer ${effectiveToken}`,
        } as const;

        const [workResponse, educationResponse] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/work_experience?user_id=eq.${effectiveUserId}&select=*`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/education_history?user_id=eq.${effectiveUserId}&select=*`, { headers }),
        ]);

        const [workData, educationData] = await Promise.all([
          workResponse.ok ? workResponse.json() : Promise.resolve([]),
          educationResponse.ok ? educationResponse.json() : Promise.resolve([]),
        ]);

        const workEvents: TimelineEvent[] = (workData as WorkExperience[]).map((exp) => ({
          id: exp.id,
          type: 'work',
          title: exp.job_title || 'Work experience',
          subtitle: exp.company || undefined,
          startDate: exp.start_date,
          endDate: exp.end_date,
          isCurrent: !!exp.still_work_here,
          sortDate: exp.start_date || exp.end_date,
        }));

        const educationEvents: TimelineEvent[] = (educationData as EducationHistory[]).map((edu) => ({
          id: edu.id,
          type: 'education',
          title: edu.qualification_type || 'Education',
          subtitle: edu.institution || undefined,
          startDate: edu.start_date,
          endDate: edu.end_date,
          isCurrent: !!edu.still_studying,
          meta: edu.subject || undefined,
          sortDate: edu.start_date || edu.end_date,
        }));

        setEvents([...workEvents, ...educationEvents]);
      } catch (error) {
        console.error('Error fetching timeline:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [user, accessToken, userId, accessTokenOverride, refreshTrigger]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aDate = a.sortDate ? new Date(a.sortDate).getTime() : 0;
      const bDate = b.sortDate ? new Date(b.sortDate).getTime() : 0;
      return bDate - aDate;
    });
  }, [events]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const calculateDuration = (startDate?: string | null, endDate?: string | null) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years <= 0 && remainingMonths <= 0) return null;
    if (years === 0) {
      return `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    }
    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    }
    return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
  };

  const getDurationMonths = (startDate?: string | null, endDate?: string | null) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(0, months);
  };

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
      case 'education':
        return GraduationCap;
      case 'certification':
        return Award;
      default:
        return Briefcase;
    }
  };

  const getEventStyles = (type: TimelineEventType, isCurrent?: boolean) => {
    if (type === 'work') {
      return isCurrent
        ? 'bg-gradient-to-br from-[#9EBC9E]/5 to-[#FFAFC5]/5 border-[#9EBC9E]/20'
        : 'bg-white border-gray-200';
    }

    if (type === 'education') {
      return 'bg-gradient-to-br from-[#CFC6B8]/5 to-[#9EBC9E]/5 border-[#CFC6B8]/30';
    }

    return 'bg-gradient-to-br from-[#FFCFD2]/5 to-[#FFAFC5]/5 border-[#FFCFD2]/30';
  };

  const getDotStyles = (type: TimelineEventType, isCurrent?: boolean) => {
    if (type === 'work') {
      return isCurrent
        ? 'bg-gradient-to-br from-[#9EBC9E] to-[#FFAFC5]'
        : 'bg-gradient-to-br from-gray-400 to-gray-500';
    }
    if (type === 'education') {
      return 'bg-gradient-to-br from-[#CFC6B8] to-[#9EBC9E]';
    }
    return 'bg-gradient-to-br from-[#FFCFD2] to-[#FFAFC5]';
  };

  const getDurationBarStyles = (type: TimelineEventType) => {
    if (type === 'work') {
      return 'bg-gradient-to-b from-[#9EBC9E] to-[#FFAFC5] shadow-md';
    }
    if (type === 'education') {
      return 'bg-gradient-to-b from-[#CFC6B8] to-[#9EBC9E] shadow-md';
    }
    return 'bg-gradient-to-b from-[#FFCFD2] to-[#FFAFC5] shadow-md';
  };

  const getTypeLabel = (type: TimelineEventType) => {
    if (type === 'education') return 'Education';
    return 'Work';
  };

  const getTypeLabelStyles = (type: TimelineEventType) => {
    if (type === 'education') {
      return 'bg-[#CFC6B8]/20 text-[#7a6f5a] border-[#CFC6B8]/40';
    }
    return 'bg-[#9EBC9E]/20 text-[#4b6b4b] border-[#9EBC9E]/40';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Work, education, and certifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
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

  if (sortedEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Work, education, and certifications</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          No timeline events added yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <CardDescription>
          {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''} across your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#9EBC9E] via-[#FFAFC5] to-[#AA778A]"></div>

          <div className="space-y-8">
            {sortedEvents.map((event) => {
              const Icon = getEventIcon(event.type);
              const duration = event.type === 'work' ? calculateDuration(event.startDate, event.isCurrent ? null : event.endDate) : null;
              const durationMonths = getDurationMonths(event.startDate, event.isCurrent ? null : event.endDate);
              const durationHeight = Math.min(120, Math.max(16, durationMonths * 4));

              return (
                <div key={`${event.type}-${event.id}`} className="relative pl-16">
                  <div className={`absolute left-3 w-6 h-6 rounded-full border-4 border-white shadow-md ${getDotStyles(event.type, event.isCurrent)}`}>
                    {event.isCurrent && event.type === 'work' && (
                      <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75"></div>
                    )}
                  </div>

                  <div
                    className={`absolute left-[22.5px] top-7 w-0.5 rounded-full ${getDurationBarStyles(event.type)}`}
                    style={{ height: `${durationHeight}px` }}
                  />

                  <div className={`rounded-lg border p-4 transition-all hover:shadow-lg ${getEventStyles(event.type, event.isCurrent)}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900">{event.title}</h3>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border rounded-full ${getTypeLabelStyles(event.type)}`}
                          >
                            {getTypeLabel(event.type)}
                          </span>
                          {event.isCurrent && (
                            <span className="px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-[#9EBC9E] to-[#FFAFC5] rounded-full">
                              Current
                            </span>
                          )}
                        </div>

                        {event.subtitle && (
                          <div className="flex items-center gap-2 text-gray-600 mb-2">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{event.subtitle}</span>
                          </div>
                        )}

                        {event.meta && (
                          <div className="text-sm text-gray-500 mb-2">{event.meta}</div>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDate(event.startDate)} - {event.isCurrent ? 'Present' : formatDate(event.endDate)}
                            </span>
                          </div>
                          {duration && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-[#AA778A]">{duration}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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
