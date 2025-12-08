import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, MapPin, Calendar, Briefcase, GraduationCap, Heart } from 'lucide-react';

interface InternationalExperience {
  id: string;
  country: string;
  city: string;
  experience_type: string;
  description: string;
  start_date: string;
  end_date: string | null;
  duration_months: number;
  purpose: string;
}

export const InternationalExperienceMap = () => {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState<InternationalExperience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExperiences = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('international_experience')
          .select('*')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });

        if (error) throw error;
        setExperiences(data || []);
      } catch (error) {
        console.error('Error fetching international experience:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, [user]);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'work':
        return Briefcase;
      case 'study':
        return GraduationCap;
      case 'volunteer':
        return Heart;
      default:
        return MapPin;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'work':
        return '#D1163E';
      case 'study':
        return '#FF9F14';
      case 'volunteer':
        return '#10B981';
      default:
        return '#180D51';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const totalCountries = new Set(experiences.map(exp => exp.country)).size;
  const totalMonths = experiences.reduce((sum, exp) => sum + (exp.duration_months || 0), 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>International Experience</CardTitle>
          <CardDescription>Global footprint and cross-cultural experiences</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading international experience...</div>
        </CardContent>
      </Card>
    );
  }

  if (experiences.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>International Experience</CardTitle>
          <CardDescription>Global footprint and cross-cultural experiences</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          No international experience added yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>International Experience</CardTitle>
        <CardDescription>
          {totalCountries} {totalCountries === 1 ? 'country' : 'countries'} • {totalMonths} months abroad
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">{totalCountries}</div>
            <div className="text-xs text-gray-600 font-medium">Countries</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-[#FF9F14]/10 to-[#FF9F14]/5 border border-[#FF9F14]/20">
            <Calendar className="h-8 w-8 text-[#FF9F14] mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">{totalMonths}</div>
            <div className="text-xs text-gray-600 font-medium">Months Abroad</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-[#10B981]/10 to-[#10B981]/5 border border-[#10B981]/20">
            <MapPin className="h-8 w-8 text-[#10B981] mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">{experiences.length}</div>
            <div className="text-xs text-gray-600 font-medium">Experiences</div>
          </div>
        </div>

        {/* Experience Cards */}
        <div className="space-y-4">
          {experiences.map((exp) => {
            const Icon = getTypeIcon(exp.experience_type);
            const color = getTypeColor(exp.experience_type);
            
            return (
              <div 
                key={exp.id}
                className="relative rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-all bg-gradient-to-br from-white to-gray-50"
              >
                {/* Type Badge */}
                <div 
                  className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1"
                  style={{ backgroundColor: color }}
                >
                  <Icon className="h-3 w-3" />
                  {exp.experience_type}
                </div>

                {/* Location */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    ></div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {exp.city}, {exp.country}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 ml-5">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : 'Present'}
                    </span>
                    <span className="font-semibold" style={{ color }}>
                      {exp.duration_months} {exp.duration_months === 1 ? 'month' : 'months'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-3 ml-5">
                  {exp.description}
                </p>

                {/* Purpose */}
                <div className="ml-5 p-3 bg-gray-100 rounded-md">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Purpose
                  </div>
                  <div className="text-sm text-gray-700">
                    {exp.purpose}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Country List */}
        <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
          <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Countries Visited
          </h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(experiences.map(exp => exp.country))).map((country, index) => (
              <span 
                key={index}
                className="px-3 py-1.5 bg-white border-2 border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-primary hover:text-primary transition-colors"
              >
                🌍 {country}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
