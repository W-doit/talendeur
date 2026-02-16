import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, MapPin, Calendar, Briefcase, GraduationCap, Heart } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Country coordinates mapping
const countryCoordinates: { [key: string]: [number, number] } = {
  'France': [46.603354, 1.888334],
  'Spain': [40.463667, -3.74922],
  'Germany': [51.165691, 10.451526],
  'Italy': [41.87194, 12.56738],
  'United Kingdom': [55.378051, -3.435973],
  'United States': [37.09024, -95.712891],
  'Canada': [56.130366, -106.346771],
  'Australia': [-25.274398, 133.775136],
  'Japan': [36.204824, 138.252924],
  'China': [35.86166, 104.195397],
  'Brazil': [-14.235004, -51.92528],
  'Mexico': [23.634501, -102.552784],
  'India': [20.593684, 78.96288],
  'South Africa': [-30.559482, 22.937506],
  'Netherlands': [52.132633, 5.291266],
  'Belgium': [50.503887, 4.469936],
  'Switzerland': [46.818188, 8.227512],
  'Sweden': [60.128161, 18.643501],
  'Norway': [60.472024, 8.468946],
  'Denmark': [56.26392, 9.501785],
  'Portugal': [39.399872, -8.224454],
  'Greece': [39.074208, 21.824312],
  'Poland': [51.919438, 19.145136],
  'Austria': [47.516231, 14.550072],
  'Ireland': [53.41291, -8.24389],
  'Finland': [61.92411, 25.748151],
  'Singapore': [1.352083, 103.819836],
  'South Korea': [35.907757, 127.766922],
  'Thailand': [15.870032, 100.992541],
  'Vietnam': [14.058324, 108.277199],
  'Argentina': [-38.416097, -63.616672],
  'Chile': [-35.675147, -71.542969],
  'UAE': [23.424076, 53.847818],
  'Russia': [61.52401, 105.318756],
  'Turkey': [38.963745, 35.243322],
  'Egypt': [26.820553, 30.802498],
  'Morocco': [31.791702, -7.09262],
  'New Zealand': [-40.900557, 174.885971],
  'Indonesia': [-0.789275, 113.921327],
  'Malaysia': [4.210484, 101.975766],
  'Philippines': [12.879721, 121.774017],
  'Colombia': [4.570868, -74.297333],
  'Peru': [-9.189967, -75.015152],
  'Czech Republic': [49.817492, 15.472962],
  'Hungary': [47.162494, 19.503304],
  'Romania': [45.943161, 24.96676],
};

interface InternationalExperienceMapProps {
  userId?: string;
  accessTokenOverride?: string | null;
}

export const InternationalExperienceMap = ({ userId, accessTokenOverride }: InternationalExperienceMapProps = {}) => {
  const { user, accessToken } = useAuth();
  const [experiences, setExperiences] = useState<InternationalExperience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExperiences = async () => {
      if (!user || !accessToken) return;

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const response = await fetch(
          `${supabaseUrl}/rest/v1/international_experience?user_id=eq.${user.id}&select=*&order=start_date.desc`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${accessToken}`,
            }
          }
        );
        const data = await response.json();
        setExperiences(data || []);
      } catch (error) {
        console.error('Error fetching international experience:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, [user, accessToken, userId, accessTokenOverride]);

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
        return '#AA778A';
      case 'study':
        return '#9EBC9E';
      case 'volunteer':
        return '#FFAFC5';
      default:
        return '#553E4E';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Create custom marker icons based on experience type
  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  // Group experiences by country
  const experiencesByCountry = experiences.reduce((acc, exp) => {
    if (!acc[exp.country]) {
      acc[exp.country] = [];
    }
    acc[exp.country].push(exp);
    return acc;
  }, {} as { [key: string]: InternationalExperience[] });


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
        {/* Map */}
        <div className="w-full h-[500px] rounded-lg overflow-hidden border-2 border-gray-200 mb-6">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {Object.entries(experiencesByCountry).map(([country, exps]) => {
              const coords = countryCoordinates[country] || [0, 0];
              // Use the color of the first experience for the marker
              const primaryColor = getTypeColor(exps[0].experience_type);
              
              return (
                <Marker 
                  key={country} 
                  position={coords}
                  icon={createCustomIcon(primaryColor)}
                >
                  <Popup maxWidth={400}>
                    <div className="p-2">
                      <h3 className="font-bold text-lg mb-3 text-gray-900 border-b pb-2">
                        {country}
                      </h3>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {exps.map((exp) => {
                          const Icon = getTypeIcon(exp.experience_type);
                          const color = getTypeColor(exp.experience_type);
                          
                          return (
                            <div key={exp.id} className="border-l-4 pl-3 py-2" style={{ borderColor: color }}>
                              <div className="flex items-center gap-2 mb-1">
                                <div 
                                  className="px-2 py-0.5 rounded text-xs font-semibold text-white flex items-center gap-1"
                                  style={{ backgroundColor: color }}
                                >
                                  <Icon className="h-3 w-3" />
                                  {exp.experience_type}
                                </div>
                              </div>
                              <p className="font-semibold text-sm text-gray-900">{exp.city}</p>
                              <p className="text-xs text-gray-600 mb-1">
                                {formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : 'Present'} 
                                <span className="ml-2 font-semibold" style={{ color }}>
                                  ({exp.duration_months} {exp.duration_months === 1 ? 'month' : 'months'})
                                </span>
                              </p>
                              <p className="text-xs text-gray-700 mb-1">{exp.description}</p>
                              <p className="text-xs text-gray-600 italic">
                                <span className="font-semibold">Purpose:</span> {exp.purpose}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-[#9EBC9E]/10 to-[#9EBC9E]/5 border border-[#9EBC9E]/20">
            <Globe className="h-8 w-8 text-[#9EBC9E] mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">{totalCountries}</div>
            <div className="text-xs text-gray-600 font-medium">Countries</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-[#CFC6B8]/10 to-[#CFC6B8]/5 border border-[#CFC6B8]/20">
            <Calendar className="h-8 w-8 text-[#CFC6B8] mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">{totalMonths}</div>
            <div className="text-xs text-gray-600 font-medium">Months Abroad</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-[#FFCFD2]/10 to-[#FFCFD2]/5 border border-[#FFCFD2]/20">
            <MapPin className="h-8 w-8 text-[#FFCFD2] mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">{experiences.length}</div>
            <div className="text-xs text-gray-600 font-medium">Experiences</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
