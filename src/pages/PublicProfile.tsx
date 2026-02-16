import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { KeyMetricsCards } from '@/components/dashboard/KeyMetricsCards';
import { SkillsRadarChart } from '@/components/dashboard/SkillsRadarChart';
import { Timeline } from '@/components/dashboard/Timeline';
import { CertificationsChart } from '@/components/dashboard/CertificationsChart';
import { ESGChart } from '@/components/dashboard/ESGChart';
import { InternationalExperienceMap } from '@/components/dashboard/InternationalExperienceMap';
import { BiographyWordCloud } from '@/components/dashboard/BiographyWordCloud';
import { PersonalityVisualization } from '@/components/dashboard/PersonalityVisualization';
import { ReferencesDisplay } from '@/components/dashboard/ReferencesDisplay';
import type { JobSeekerProfile, OrganizationProfile, UserType } from '@/contexts/AuthContext';

// Extend existing profile types with optional videoUrl
export type PublicProfileData =
  | (JobSeekerProfile & { videoUrl?: string })
  | (OrganizationProfile & { videoUrl?: string });

const getVideoEmbedUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace('www.', '');

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      const videoId = parsedUrl.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (hostname === 'youtu.be') {
      const videoId = parsedUrl.pathname.replace('/', '').trim();
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (hostname === 'vimeo.com') {
      const videoId = parsedUrl.pathname.replace('/', '').trim();
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    return url;
  } catch {
    return url;
  }
};

const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const supabaseUrl = useMemo(() => import.meta.env.VITE_SUPABASE_URL, []);
  const supabaseKey = useMemo(() => import.meta.env.VITE_SUPABASE_ANON_KEY, []);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const profileResponse = await fetch(
          `${supabaseUrl}/rest/v1/profile?user_id=eq.${userId}&select=*`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );

        const profileDataArray = await profileResponse.json();
        const profileData = profileDataArray?.[0];

        if (!profileResponse.ok || !profileData) {
          setProfile(null);
          setUserType(null);
          return;
        }

        const profileUserType = profileData.user_type as UserType;
        setUserType(profileUserType);

        if (profileUserType === 'jobseeker') {
          const skillResponse = await fetch(
            `${supabaseUrl}/rest/v1/jobseeker_skill_rating?user_id=eq.${profileData.user_id}&select=*`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            }
          );
          const skillDataArray = await skillResponse.json();
          const skillData = skillDataArray?.[0];

          setProfile({
            id: profileData.user_id,
            name: `${profileData.first_name} ${profileData.surname}`.trim(),
            email: profileData.email,
            headline: profileData.headline || undefined,
            profilePic: profileData.profile_pic || '',
            cv: profileData.cv_url || '',
            videoUrl: profileData.video_url || '',
            interests: skillData?.interests || [],
            skills: {
              soft: skillData?.soft_skills || 70,
              hard: skillData?.hard_skills || 70,
              feedback: skillData?.feedback_score || 70,
              learning: skillData?.learning_score || 70,
            },
            bio: profileData.bio || '',
          });
        } else {
          const orgResponse = await fetch(
            `${supabaseUrl}/rest/v1/organization_details?organization_id=eq.${profileData.user_id}&select=*`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            }
          );
          const orgDataArray = await orgResponse.json();
          const orgData = orgDataArray?.[0];

          setProfile({
            id: profileData.user_id,
            name: orgData?.company_name || '',
            email: profileData.email,
            headline: profileData.headline || undefined,
            logo: orgData?.logo || '',
            videoUrl: profileData.video_url || '',
            website: orgData?.website || '',
            about: orgData?.about || '',
            needs: orgData?.needs || [],
          } as PublicProfileData);
        }
      } catch (error) {
        console.error('Error loading public profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [userId, supabaseKey, supabaseUrl]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto py-12 px-4 text-center">
          <p className="text-lg">Loading profile...</p>
        </div>
      </MainLayout>
    );
  }

  if (!profile || !userType) {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto py-12 px-4 text-center">
          <p className="text-lg">Profile not found.</p>
        </div>
      </MainLayout>
    );
  }

  const imageUrl = userType === 'jobseeker'
    ? (profile as JobSeekerProfile).profilePic
    : (profile as OrganizationProfile).logo;

  return (
    <MainLayout>
      <div className="container max-w-7xl mx-auto py-12 px-4">
        <div className="space-y-8">
          {/* Profile header */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0 flex flex-col md:flex-row items-center gap-4">
                <div className="flex flex-col items-center gap-3">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={profile.name}
                      className={userType === 'jobseeker'
                        ? 'h-28 w-28 rounded-full object-cover border-4 border-gray-200'
                        : 'h-28 w-28 rounded-lg object-cover border-4 border-gray-200'
                      }
                    />
                  ) : (
                    <div
                      className={userType === 'jobseeker'
                        ? 'h-28 w-28 rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center'
                        : 'h-28 w-28 rounded-lg bg-gray-200 border-4 border-gray-300 flex items-center justify-center'
                      }
                    >
                      <span className="text-4xl font-bold text-gray-600">
                        {profile.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 w-full">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 text-center md:text-left">
                  <div>
                    <h2 className="text-2xl font-bold text-black">{profile.name}</h2>
                    {(profile as JobSeekerProfile | OrganizationProfile).headline && (
                      <p className="text-lg text-gray-700 mt-2 italic font-light">
                        {(profile as JobSeekerProfile | OrganizationProfile).headline}
                      </p>
                    )}
                    {userType === 'organization' && (profile as OrganizationProfile).website && (
                      <p className="text-gray-600 mt-1">
                        <a href={(profile as OrganizationProfile).website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {(profile as OrganizationProfile).website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left column: Timeline (all date-based items) */}
            <div className="w-full md:w-1/3 flex flex-col gap-8">
              <Timeline userId={profile.id} accessTokenOverride={null} />
              <CertificationsChart userId={profile.id} accessTokenOverride={null} />
            </div>
            {/* Right column: Visualizations and info boxes */}
            <div className="w-full md:w-2/3 flex flex-col gap-8">
              <KeyMetricsCards userId={profile.id} accessTokenOverride={null} />
              {profile.videoUrl && (
                <Card>
                  <Collapsible open={isVideoOpen} onOpenChange={setIsVideoOpen}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Video Profile</CardTitle>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/70 text-talendeur-primary hover:bg-white/90 border-talendeur-primary"
                          aria-label={isVideoOpen ? 'Collapse video profile' : 'Expand video profile'}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${isVideoOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="relative w-full overflow-hidden rounded-lg border border-gray-200">
                          <div className="aspect-video">
                            <iframe
                              src={getVideoEmbedUrl(profile.videoUrl)}
                              title="Profile video"
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )}
              <BiographyWordCloud userId={profile.id} accessTokenOverride={null} />
              <SkillsRadarChart userId={profile.id} accessTokenOverride={null} />
              <PersonalityVisualization userId={profile.id} accessTokenOverride={null} />
              <ESGChart userId={profile.id} accessTokenOverride={null} />
            </div>
          </div>

          {/* Full-width International Experience Map */}
          <div className="w-full">
            <InternationalExperienceMap userId={profile.id} accessTokenOverride={null} />
          </div>

          {/* Full-width References */}
          <div className="w-full">
            <ReferencesDisplay userId={profile.id} accessTokenOverride={null} />
          </div>

          {/* Interests and Needs sections */}
          <div className="flex flex-col gap-8">
            {userType === 'jobseeker' && (profile as JobSeekerProfile).interests && (profile as JobSeekerProfile).interests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Interests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(profile as JobSeekerProfile).interests.map((interest: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-talendeur-primary/10 text-talendeur-primary rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {userType === 'organization' && (profile as OrganizationProfile).needs && (profile as OrganizationProfile).needs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>We're Looking For</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(profile as OrganizationProfile).needs.map((need: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-talendeur-orange/10 text-talendeur-orange rounded-full text-sm"
                      >
                        {need}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PublicProfile;
