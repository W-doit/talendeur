
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserType, JobSeekerProfile, OrganizationProfile } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import JobSeekerProfileForm from '@/components/profile/JobSeekerProfileForm';
import OrganizationProfileForm from '@/components/profile/OrganizationProfileForm';
import MainLayout from '@/components/layout/MainLayout';
import FeedbackButton from '@/components/FeedbackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { KeyMetricsCards } from '@/components/dashboard/KeyMetricsCards';
import { SkillsRadarChart } from '@/components/dashboard/SkillsRadarChart';
import { Timeline } from '@/components/dashboard/Timeline';
import { CertificationsChart } from '@/components/dashboard/CertificationsChart';
import { ESGChart } from '@/components/dashboard/ESGChart';
import { InternationalExperienceMap } from '@/components/dashboard/InternationalExperienceMap';
import { BiographyWordCloud } from '@/components/dashboard/BiographyWordCloud';
import { AIProficiencyChart } from '@/components/dashboard/AIProficiencyChart';
import { PersonalityVisualization } from '@/components/dashboard/PersonalityVisualization';
import { WorkExperienceForm } from '@/components/profile/WorkExperienceForm';
import { EducationForm } from '@/components/profile/EducationForm';
import { AIProficiencyForm } from '@/components/profile/AIProficiencyForm';
import { CertificationsForm } from '@/components/profile/CertificationsForm';
import { ReferencesForm } from '@/components/profile/ReferencesForm';
import { ReferencesDisplay } from '@/components/dashboard/ReferencesDisplay';
import { PersonalityTest } from '@/components/profile/PersonalityTest';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { generateDashboardPreview } from '@/lib/dashboard-screenshot';

const Profile: React.FC = () => {
  const { user, createProfile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [selectedUserType, setSelectedUserType] = useState<UserType>('jobseeker');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [importedData, setImportedData] = useState<any>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [aiProficiencyData, setAIProficiencyData] = useState<any>(null);
  const [aiToolsData, setAIToolsData] = useState<any[]>([]);
  const dashboardRef = React.useRef<HTMLDivElement>(null);

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

  const publicProfileUrl = user?.profile?.id
    ? `${window.location.origin}/public/${user.profile.id}`
    : '';

  const handleCopyProfileUrl = async () => {
    if (!publicProfileUrl) return;
    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      toast({ title: 'Profile link copied' });
    } catch (error) {
      console.error('Failed to copy profile URL:', error);
      toast({ title: 'Copy failed', description: 'Please try again.' });
    }
  };

  const handleShareToLinkedIn = async () => {
    if (!dashboardRef.current || !user?.id) return;
    
    setIsGeneratingPreview(true);
    try {
      // Generate and save the snapshot
      const imageUrl = await generateDashboardPreview(dashboardRef.current, user.id);
      
      console.log('Dashboard preview URL:', imageUrl);
      
      // Open LinkedIn sharing dialog with the profile link
      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicProfileUrl)}&text=${encodeURIComponent(`Check out my professional profile on Talendeur! #Talendeur ${publicProfileUrl}`)}`;
      window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
      
      toast({
        title: 'Sharing to LinkedIn',
        description: 'Your profile preview has been generated and LinkedIn is opening.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to share profile:', error);
      toast({
        title: 'Share failed',
        description: error instanceof Error ? error.message : 'Could not share profile',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };
  
  // Check if profile has been filled out (has a name or other basic info)
  const hasCompleteProfile = user?.profile && (
    user.profile.name || 
    user.profile.email ||
    (user.profile as any).bio
  );
  
  // Exit edit mode when navigating to profile page (including header Profile click)
  React.useEffect(() => {
    const locationState = location.state as { mode?: string } | null;
    if (hasCompleteProfile && location.pathname === '/profile') {
      if (locationState?.mode === 'view') {
        setIsEditMode(false);
      }
    }
  }, [location.pathname, location.state, hasCompleteProfile]);

  // Log when importedData changes
  React.useEffect(() => {
    console.log('Profile.tsx - importedData changed:', importedData);
    if (importedData?.parsedData) {
      console.log('Profile.tsx - workExperience:', importedData.parsedData.workExperience);
      console.log('Profile.tsx - education:', importedData.parsedData.education);
    }
  }, [importedData]);
  
  // Fetch AI proficiency data
  React.useEffect(() => {
    const fetchAIProficiency = async () => {
      if (!user?.id) return;
      
      try {
        // Fetch AI proficiency categories
        const { data: proficiencyData, error: proficiencyError } = await supabase
          .from('ai_proficiency')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (proficiencyError && proficiencyError.code !== 'PGRST116') {
          console.error('Error fetching AI proficiency:', proficiencyError);
        } else {
          console.log('Profile page - AI proficiency data:', proficiencyData);
          setAIProficiencyData(proficiencyData);
        }
        
        // Fetch AI tools used
        const { data: toolsData, error: toolsError } = await supabase
          .from('ai_tools_used')
          .select('*')
          .eq('user_id', user.id);
        
        if (toolsError) {
          console.error('Error fetching AI tools:', toolsError);
        } else {
          console.log('Profile page - AI tools data:', toolsData);
          setAIToolsData(toolsData || []);
        }
      } catch (err) {
        console.error('Error in AI proficiency fetch:', err);
      }
    };
    
    fetchAIProficiency();
  }, [user, refreshTrigger]);
  
  // Redirect to login if no user (only after loading is complete)
  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Automatically enter edit mode if profile is incomplete
  React.useEffect(() => {
    if (user?.profile && !hasCompleteProfile) {
      setIsEditMode(true);
    }
  }, [user, hasCompleteProfile]);

  const handleCreateProfile = async () => {
    setIsCreatingProfile(true);
    try {
      const success = await createProfile(selectedUserType);
      if (success) {
        // Reload the page to fetch the newly created profile
        window.location.reload();
      } else {
        alert('Failed to create profile. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      alert('An error occurred while creating your profile.');
    } finally {
      setIsCreatingProfile(false);
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto py-12 px-4 text-center">
          <p className="text-lg">Loading profile...</p>
        </div>
      </MainLayout>
    );
  }
  
  if (!user) {
    return null;
  }

  // User is authenticated but has no profile - show profile type selection
  if (!user.profile) {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto py-12 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Talendeur!</CardTitle>
              <CardDescription>
                Let's set up your profile. Are you looking for work or looking to hire?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs 
                value={selectedUserType} 
                onValueChange={(value) => setSelectedUserType(value as UserType)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="jobseeker">Individual</TabsTrigger>
                  <TabsTrigger value="organization">Organisation</TabsTrigger>
                </TabsList>
                <TabsContent value="jobseeker" className="pt-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Job Seeker Profile</h3>
                    <p className="text-sm text-muted-foreground">
                      Create your professional profile to showcase your skills and experience. 
                      Get matched with organizations looking for talent like you.
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="organization" className="pt-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Organization Profile</h3>
                    <p className="text-sm text-muted-foreground">
                      Create your organization profile to find the perfect candidates. 
                      Connect with skilled professionals who match your needs.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <Button 
                onClick={handleCreateProfile}
                disabled={isCreatingProfile}
                className="w-full bg-talendeur-primary hover:bg-talendeur-primary-dark"
              >
                {isCreatingProfile ? 'Creating Profile...' : 'Create Profile & Continue'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-7xl mx-auto py-12 px-4">
        <div className="space-y-8">
          {hasCompleteProfile && !isEditMode ? (
            // View Mode - Show profile information
            <>
              {/* Profile header */}
              <div className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0 flex flex-col md:flex-row items-center gap-4">
                    <div className="flex flex-col items-center gap-3">
                      {(() => {
                        const imageUrl = user.userType === 'jobseeker' 
                          ? (user.profile as JobSeekerProfile).profilePic 
                          : (user.profile as OrganizationProfile).logo;
                        
                        if (imageUrl) {
                          return (
                            <img 
                              src={imageUrl}
                              alt={user.profile.name}
                              className={user.userType === 'jobseeker' ? 'h-40 w-40 rounded-full object-cover border-4 border-gray-200' : 'h-40 w-40 rounded-lg object-cover border-4 border-gray-200'}
                            />
                          );
                        } else {
                          return (
                            <div 
                              className={user.userType === 'jobseeker'
                                ? 'h-40 w-40 rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center'
                                : 'h-40 w-40 rounded-lg bg-gray-200 border-4 border-gray-300 flex items-center justify-center'
                              }
                            >
                              <span className="text-5xl font-bold text-gray-600">
                                {user.profile.name?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                    
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 text-center md:text-left">
                      <div>
                        <h2 className="text-2xl font-bold text-black">{user.profile.name}</h2>
                        {(user.profile as JobSeekerProfile | OrganizationProfile).headline && (
                          <p className="text-lg text-gray-700 mt-2 italic font-light">
                            {(user.profile as JobSeekerProfile | OrganizationProfile).headline}
                          </p>
                        )}
                        {user.userType === 'organization' && (user.profile as OrganizationProfile).website && (
                          <p className="text-gray-600 mt-1">
                            <a href={(user.profile as OrganizationProfile).website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {(user.profile as OrganizationProfile).website}
                            </a>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={() => setIsEditMode(true)}
                          size="sm"
                          variant="outline"
                          className="bg-white/70 text-talendeur-primary hover:bg-talendeur-primary hover:text-white border-talendeur-primary transition-colors"
                        >
                          Edit Profile
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white/70 text-talendeur-primary hover:bg-talendeur-primary hover:text-white border-talendeur-primary transition-colors"
                            >
                              Share your profile
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={handleShareToLinkedIn} disabled={isGeneratingPreview}>
                              {isGeneratingPreview ? 'Generating & Sharing...' : 'Share to LinkedIn'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCopyProfileUrl}>
                              Copy URL
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div ref={dashboardRef} className="flex flex-col md:flex-row gap-8">
                {/* Job Seeker Dashboard Elements */}
                {user.userType === 'jobseeker' && (
                  <>
                    {/* Left column: Timeline (all date-based items) */}
                    <div className="w-full md:w-1/3 flex flex-col gap-8">
                      <Timeline refreshTrigger={refreshTrigger} />
                      <CertificationsChart />
                    </div>
                    {/* Right column: Visualizations and info boxes */}
                    <div className="w-full md:w-2/3 flex flex-col gap-8">
                      <KeyMetricsCards />
                      <AIProficiencyChart data={aiProficiencyData} tools={aiToolsData} />
                      {(user.profile as any).videoUrl && (
                        <Card>
                          <Collapsible open={isVideoOpen} onOpenChange={setIsVideoOpen}>
                            <CardHeader className="flex flex-row items-center justify-between">
                              <CardTitle>Video Profile</CardTitle>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-white/70 text-talendeur-primary hover:bg-talendeur-primary hover:text-white border-talendeur-primary transition-colors"
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
                                      src={getVideoEmbedUrl((user.profile as any).videoUrl)}
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
                      {(user.profile as any).portfolioUrl && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Portfolio</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <a 
                              href={(user.profile as any).portfolioUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-talendeur-primary hover:text-talendeur-orange transition-colors font-medium"
                            >
                              <ExternalLink size={18} />
                              <span>Visit Portfolio</span>
                            </a>
                          </CardContent>
                        </Card>
                      )}
                      <BiographyWordCloud />
                      <SkillsRadarChart />
                      <PersonalityVisualization />
                      <ESGChart />
                    </div>
                  </>
                )}

                {/* Organization Dashboard Elements */}
                {user.userType === 'organization' && (
                  <div className="w-full flex flex-col gap-8">
                    {(user.profile as any).videoUrl && (
                      <Card>
                        <Collapsible open={isVideoOpen} onOpenChange={setIsVideoOpen}>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Organization Video</CardTitle>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-white/70 text-talendeur-primary hover:bg-talendeur-primary hover:text-white border-talendeur-primary transition-colors"
                                aria-label={isVideoOpen ? 'Collapse video' : 'Expand video'}
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
                                    src={getVideoEmbedUrl((user.profile as any).videoUrl)}
                                    title="Organization video"
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
                    
                    {(user.profile as OrganizationProfile).about && (
                      <Card>
                        <CardHeader>
                          <CardTitle>About</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 whitespace-pre-wrap">{(user.profile as OrganizationProfile).about}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              {/* Full-width sections - only for job seekers */}
              {user.userType === 'jobseeker' && (
                <>
                  <div className="w-full">
                    <InternationalExperienceMap />
                  </div>

                  <div className="w-full">
                    <ReferencesDisplay />
                  </div>
                </>
              )}

              {/* Interests and Needs sections */}
              <div className="flex flex-col gap-8">
                  {user.userType === 'jobseeker' && (user.profile as JobSeekerProfile).interests && (user.profile as JobSeekerProfile).interests.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Interests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {(user.profile as JobSeekerProfile).interests.map((interest: string, index: number) => (
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
                  {user.userType === 'organization' && (user.profile as OrganizationProfile).needs && (user.profile as OrganizationProfile).needs.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>We're Looking For</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {(user.profile as OrganizationProfile).needs.map((need: string, index: number) => (
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
            </>
          ) : (
            // Edit Mode - Show form
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{hasCompleteProfile ? 'Edit Profile' : 'Complete Your Profile'}</CardTitle>
                    <CardDescription>
                      {hasCompleteProfile ? 'Update your information' : 'Fill in your details to start matching'}
                    </CardDescription>
                  </div>
                  {hasCompleteProfile && (
                    <Button 
                      onClick={() => {
                        setIsEditMode(false);
                        // Refresh all dashboard data when viewing profile
                        setRefreshTrigger(prev => prev + 1);
                      }}
                      size="sm"
                      variant="outline"
                      className="bg-white/70 text-talendeur-primary hover:bg-talendeur-primary hover:text-white transition-colors"
                    >
                      View Profile
                    </Button>
                  )}
                </CardHeader>
              </Card>

              {user.userType === 'jobseeker' ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" key={isEditMode ? 'edit' : 'view'}>
                  <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="work">Work</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                    <TabsTrigger value="certifications">Certifications</TabsTrigger>
                    <TabsTrigger value="references">References</TabsTrigger>
                    <TabsTrigger value="ai-skills">AI Skills</TabsTrigger>
                    <TabsTrigger value="personality">Personality</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="mt-6">
                    <Card>
                      <CardContent className="pt-6">
                        <JobSeekerProfileForm 
                          importedData={importedData}
                          onDataImport={setImportedData}
                          onParsingStart={() => {
                            // Redirect to AI Skills tab when CV parsing starts
                            setActiveTab('ai-skills');
                          }}
                          onSaveComplete={() => {
                            // After saving basic info, move to work experience tab
                            if (importedData?.parsedData?.workExperience?.length > 0) {
                              setActiveTab('work');
                              toast({
                                title: 'Moving to Work Experience',
                                description: 'Please review and save your work experience.',
                                duration: 3000,
                              });
                            }
                          }}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="work" className="mt-6">
                    <WorkExperienceForm 
                      key={`work-${importedData?.parsedData?.workExperience?.length || 0}`}
                      importedData={importedData?.parsedData?.workExperience}
                      onSaveComplete={() => {
                        // Clear work experience imported data
                        if (importedData?.parsedData) {
                          setImportedData({
                            ...importedData,
                            parsedData: {
                              ...importedData.parsedData,
                              workExperience: null
                            }
                          });
                        }
                        
                        // After saving work, move to education tab
                        if (importedData?.parsedData?.education?.length > 0) {
                          setActiveTab('education');
                          toast({
                            title: 'Moving to Education',
                            description: 'Please review and save your education.',
                            duration: 3000,
                          });
                        }
                        setRefreshTrigger(prev => prev + 1);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="education" className="mt-6">
                    <EducationForm 
                      key={`education-${importedData?.parsedData?.education?.length || 0}`}
                      importedData={importedData?.parsedData?.education}
                      onSaveComplete={() => {
                        // Clear education imported data
                        if (importedData?.parsedData) {
                          setImportedData({
                            ...importedData,
                            parsedData: {
                              ...importedData.parsedData,
                              education: null
                            }
                          });
                        }
                        
                        // After saving education, move to certifications tab
                        if (importedData?.parsedData?.certifications?.length > 0) {
                          setActiveTab('certifications');
                          toast({
                            title: 'Moving to Certifications',
                            description: 'Please review and save your certifications.',
                            duration: 3000,
                          });
                        }
                        setRefreshTrigger(prev => prev + 1);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="ai-skills" className="mt-6">
                    <AIProficiencyForm 
                      onSaveComplete={() => {
                        // After saving AI skills, move to personality test
                        setActiveTab('personality');
                        toast({
                          title: 'Last step!',
                          description: 'Complete the personality test to finish your profile.',
                          duration: 3000,
                        });
                        setRefreshTrigger(prev => prev + 1);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="certifications" className="mt-6">
                    <CertificationsForm 
                      key={`certifications-${importedData?.parsedData?.certifications?.length || 0}`}
                      importedData={importedData?.parsedData?.certifications}
                      onSaveComplete={() => {
                        // Clear certifications imported data
                        if (importedData?.parsedData) {
                          setImportedData({
                            ...importedData,
                            parsedData: {
                              ...importedData.parsedData,
                              certifications: null
                            }
                          });
                        }
                        
                        // After saving certifications, move to references
                        setActiveTab('references');
                        toast({
                          title: 'Add references (optional)',
                          description: 'Add professional references to strengthen your profile.',
                          duration: 3000,
                        });
                        setRefreshTrigger(prev => prev + 1);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="references" className="mt-6">
                    <ReferencesForm />
                  </TabsContent>

                  <TabsContent value="personality" className="mt-6">
                    <PersonalityTest />
                  </TabsContent>
                </Tabs>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <OrganizationProfileForm />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
      <FeedbackButton />
    </MainLayout>
  );
};

export default Profile;
