import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, MapPin, Briefcase, GraduationCap, Heart } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COUNTRY_COORDINATES, type LatLng } from '@/lib/location-normalization';
import { resolveLocations } from '@/lib/geocode';

interface LocationExperience {
  id: string;
  location: string;
  city: string;
  country: string;
  coords: LatLng;
  type: 'work' | 'education';
  title: string;
  organization: string;
  start_date: string;
  end_date: string | null;
  still_active: boolean;
}

interface InternationalExperienceMapProps {
  userId?: string;
  accessTokenOverride?: string | null;
}

export const InternationalExperienceMap = ({ userId, accessTokenOverride }: InternationalExperienceMapProps = {}) => {
  const { user, accessToken } = useAuth();
  const [experiences, setExperiences] = useState<LocationExperience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExperiences = async () => {
      const effectiveUserId = userId ?? user?.id;
      const effectiveToken = accessTokenOverride !== undefined ? (accessTokenOverride || import.meta.env.VITE_SUPABASE_ANON_KEY) : (accessToken || import.meta.env.VITE_SUPABASE_ANON_KEY);

      if (!effectiveUserId) {
        setLoading(false);
        return;
      }

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const headers = {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${effectiveToken}`,
        };

        const [workResponse, educationResponse] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/work_experience?user_id=eq.${effectiveUserId}&select=*`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/education_history?user_id=eq.${effectiveUserId}&select=*`, { headers }),
        ]);

        const [workData, educationData] = await Promise.all([
          workResponse.ok ? workResponse.json() : [],
          educationResponse.ok ? educationResponse.json() : [],
        ]);

        const workRows = (workData || []) as Record<string, unknown>[];
        const educationRows = (educationData || []) as Record<string, unknown>[];

        const allLocationStrings = [
          ...workRows.map((r) => (typeof r.location === 'string' ? r.location.trim() : '')),
          ...educationRows.map((r) => (typeof r.location === 'string' ? r.location.trim() : '')),
        ].filter(Boolean);

        // Offline first, then cache, then Nominatim for unknowns (rate-limited)
        const resolved = await resolveLocations(allLocationStrings);

        const toExperience = (
          row: Record<string, unknown>,
          type: 'work' | 'education',
        ): LocationExperience | null => {
          const location = typeof row.location === 'string' ? row.location.trim() : '';
          if (!location) return null;

          const normalized = resolved.get(location) ?? null;
          if (!normalized) {
            console.warn('Unmapped location skipped for map:', location);
            return null;
          }

          if (type === 'work') {
            return {
              id: String(row.id),
              location,
              city: normalized.city,
              country: normalized.country,
              coords: normalized.coords,
              type,
              title: (row.job_title as string) || 'Position',
              organization: (row.company as string) || 'Company',
              start_date: String(row.start_date),
              end_date: (row.end_date as string) || null,
              still_active: Boolean(row.still_work_here),
            };
          }

          return {
            id: String(row.id),
            location,
            city: normalized.city,
            country: normalized.country,
            coords: normalized.coords,
            type,
            title: `${row.qualification_type || ''} ${row.subject || ''}`.trim() || 'Degree',
            organization: (row.institution as string) || 'Institution',
            start_date: String(row.start_date),
            end_date: (row.end_date as string) || null,
            still_active: Boolean(row.still_studying),
          };
        };

        const workExperiences = workRows
          .map((work) => toExperience(work, 'work'))
          .filter((e): e is LocationExperience => e !== null);

        const educationExperiences = educationRows
          .map((edu) => toExperience(edu, 'education'))
          .filter((e): e is LocationExperience => e !== null);

        const allExperiences = [...workExperiences, ...educationExperiences]
          .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

        setExperiences(allExperiences);
      } catch (error) {
        console.error('Error fetching location data:', error);
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
      case 'education':
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
      case 'education':
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

  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  /** Group by normalized country; pin at first known city coords, else country centroid */
  const experiencesByCountry = experiences.reduce((acc, exp) => {
    if (!acc[exp.country]) {
      acc[exp.country] = { experiences: [], coords: COUNTRY_COORDINATES[exp.country] ?? exp.coords };
    }
    acc[exp.country].experiences.push(exp);
    // Prefer a city-level pin when available
    if (exp.city && exp.coords) {
      acc[exp.country].coords = exp.coords;
    }
    return acc;
  }, {} as { [key: string]: { experiences: LocationExperience[]; coords: LatLng } });

  const totalCountries = Object.keys(experiencesByCountry).length;
  const totalExperiences = experiences.length;

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
          <CardDescription>Your work and education locations around the world</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          Add locations to your work experience and education to see them on the map
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>International Experience</CardTitle>
        <CardDescription>
          {totalCountries} {totalCountries === 1 ? 'country' : 'countries'} • {totalExperiences} {totalExperiences === 1 ? 'location' : 'locations'}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            {Object.entries(experiencesByCountry).map(([country, { experiences: exps, coords }]) => {
              // Never place a marker at null island
              if (!coords || (coords[0] === 0 && coords[1] === 0)) return null;

              const primaryColor = getTypeColor(exps[0].type);

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
                          const Icon = getTypeIcon(exp.type);
                          const color = getTypeColor(exp.type);

                          return (
                            <div key={exp.id} className="border-l-4 pl-3 py-2" style={{ borderColor: color }}>
                              <div className="flex items-center gap-2 mb-1">
                                <div
                                  className="px-2 py-0.5 rounded text-xs font-semibold text-white flex items-center gap-1"
                                  style={{ backgroundColor: color }}
                                >
                                  <Icon className="h-3 w-3" />
                                  {exp.type === 'work' ? 'Work' : 'Education'}
                                </div>
                              </div>
                              <p className="font-semibold text-sm text-gray-900">{exp.title}</p>
                              <p className="text-xs text-gray-700 mb-1">{exp.organization}</p>
                              {(exp.city || exp.location) && (
                                <p className="text-xs text-gray-600 mb-1">{exp.city || exp.location}</p>
                              )}
                              <p className="text-xs text-gray-600">
                                {formatDate(exp.start_date)} - {exp.still_active ? 'Present' : (exp.end_date ? formatDate(exp.end_date) : 'N/A')}
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

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-[#9EBC9E]/10 to-[#9EBC9E]/5 border border-[#9EBC9E]/20">
            <Globe className="h-8 w-8 text-[#9EBC9E] mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">{totalCountries}</div>
            <div className="text-xs text-gray-600 font-medium">Countries</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-[#AA778A]/10 to-[#AA778A]/5 border border-[#AA778A]/20">
            <Briefcase className="h-8 w-8 text-[#AA778A] mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">{experiences.filter(e => e.type === 'work').length}</div>
            <div className="text-xs text-gray-600 font-medium">Work Locations</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-[#9EBC9E]/10 to-[#9EBC9E]/5 border border-[#9EBC9E]/20">
            <GraduationCap className="h-8 w-8 text-[#9EBC9E] mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">{experiences.filter(e => e.type === 'education').length}</div>
            <div className="text-xs text-gray-600 font-medium">Education Locations</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
