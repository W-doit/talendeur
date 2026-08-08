
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { JobSeekerDashboard } from '@/components/dashboard/JobSeekerDashboard';
import { CustomizeDashboardLayout } from '@/components/dashboard/CustomizeDashboardLayout';
import { WorkExperienceForm } from '@/components/profile/WorkExperienceForm';
import { EducationForm } from '@/components/profile/EducationForm';
import { SkillsProfileForm } from '@/components/profile/SkillsProfileForm';
import { AIProficiencyForm } from '@/components/profile/AIProficiencyForm';
import { CertificationsForm } from '@/components/profile/CertificationsForm';
import { ReferencesForm } from '@/components/profile/ReferencesForm';
import { PersonalityTest } from '@/components/profile/PersonalityTest';
import { VolunteeringForm } from '@/components/profile/VolunteeringForm';
import { LanguagesForm } from '@/components/profile/LanguagesForm';
import { MfaSettings } from '@/components/auth/MfaSettings';
import { MfaChallenge } from '@/components/auth/MfaChallenge';
import { requiresMfaChallenge } from '@/lib/mfa';
import { useToast } from '@/components/ui/use-toast';
import { generateDashboardPreview } from '@/lib/dashboard-screenshot';
import { normalizeDashboardLayout, type DashboardSectionConfig } from '@/lib/dashboard-layout';

const Profile: React.FC = () => {
  const { user, createProfile, loading, updateProfile, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [selectedUserType, setSelectedUserType] = useState<UserType>('jobseeker');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [importedData, setImportedData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [aiProficiencyData, setAIProficiencyData] = useState<any>(null);
  const [aiToolsData, setAIToolsData] = useState<any>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaChecked, setMfaChecked] = useState(false);
  const dashboardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setMfaChecked(true);
        setMfaRequired(false);
        return;
      }
      try {
        const needed = await requiresMfaChallenge();
        if (!cancelled) setMfaRequired(needed);
      } catch {
        if (!cancelled) setMfaRequired(false);
      } finally {
        if (!cancelled) setMfaChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, accessToken]);

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
        // Fetch AI fluency usage data (new structure)
        const { data: usageData, error: usageError } = await supabase
          .from('ai_fluency_usage')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (usageError && usageError.code !== 'PGRST116') {
          console.error('Error fetching AI fluency usage:', usageError);
        } else {
          setAIProficiencyData(usageData);
        }
        
        // Fetch AI fluency tools data (new structure)
        const { data: toolsData, error: toolsError } = await supabase
          .from('ai_fluency_tools')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (toolsError && toolsError.code !== 'PGRST116') {
          console.error('Error fetching AI tools:', toolsError);
        } else {
          setAIToolsData(toolsData || {});
        }
      } catch (err) {
        console.error('Error in AI fluency fetch:', err);
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

  if (user && mfaChecked && mfaRequired) {
    return (
      <MainLayout>
        <div className="container max-w-md mx-auto py-16 px-4">
          <MfaChallenge
            onVerified={() => {
              setMfaRequired(false);
              window.location.reload();
            }}
          />
        </div>
      </MainLayout>
    );
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
                    <div className="flex flex-col md:flex-row md:items-stretch md:justify-between gap-3 text-center md:text-left">
                      <div className="flex flex-col flex-1">
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
                        {user.userType === 'jobseeker' && (
                          <div className="mt-auto pt-3 flex flex-wrap justify-center md:justify-start gap-2">
                            <Button
                              onClick={() => navigate('/profilerecommendations')}
                              size="sm"
                              variant="outline"
                              className="bg-white/70 text-talendeur-navy hover:bg-talendeur-navy hover:text-white border-talendeur-navy transition-colors"
                            >
                              Profile recommendations
                            </Button>
                            <Button
                              onClick={() => navigate('/ikigai')}
                              size="sm"
                              variant="outline"
                              className="bg-white/70 text-talendeur-navy hover:bg-talendeur-navy hover:text-white border-talendeur-navy transition-colors"
                            >
                              Find your ikigai
                            </Button>
                          </div>
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
                        {user.userType === 'jobseeker' && (
                          <CustomizeDashboardLayout
                            layout={normalizeDashboardLayout(
                              (user.profile as JobSeekerProfile).dashboardLayout
                            )}
                            onSave={async (nextLayout: DashboardSectionConfig[]) => {
                              await updateProfile({ dashboardLayout: nextLayout });
                              toast({
                                title: 'Layout saved',
                                description: 'Your profile dashboard layout was updated.',
                              });
                            }}
                          />
                        )}
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

              {user.userType === 'jobseeker' && (
                <JobSeekerDashboard
                  layout={(user.profile as JobSeekerProfile).dashboardLayout}
                  refreshTrigger={refreshTrigger}
                  videoUrl={(user.profile as JobSeekerProfile).videoUrl}
                  portfolioUrl={(user.profile as JobSeekerProfile).portfolioUrl}
                  interests={(user.profile as JobSeekerProfile).interests}
                  openToRelocation={(user.profile as JobSeekerProfile).openToRelocation}
                  targetOrganizations={(user.profile as JobSeekerProfile).targetOrganizations}
                  aiProficiencyData={aiProficiencyData}
                  aiToolsData={aiToolsData}
                  dashboardRef={dashboardRef}
                />
              )}

              {/* Organization Dashboard Elements */}
              {user.userType === 'organization' && (
                <div className="w-full flex flex-col gap-8">
                    {(user.profile as any).videoUrl && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Organization Video</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="relative w-full overflow-hidden rounded-lg border border-gray-200">
                            <div className="aspect-video">
                              <iframe
                                src={(user.profile as any).videoUrl}
                                title="Organization video"
                                className="h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        </CardContent>
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

                  { (user.profile as OrganizationProfile).needs && (user.profile as OrganizationProfile).needs.length > 0 && (
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
              )}
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
                  <TabsList className="grid w-full grid-cols-8">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="work">Work</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                    <TabsTrigger value="volunteering">Volunteering</TabsTrigger>
                    <TabsTrigger value="languages">Languages</TabsTrigger>
                    <TabsTrigger value="certifications">Certifications</TabsTrigger>
                    <TabsTrigger value="references">References</TabsTrigger>
                    <TabsTrigger value="skills-profile">Skills Profile</TabsTrigger>
                    <TabsTrigger value="ai-skills">AI Fluency</TabsTrigger>
                    <TabsTrigger value="personality">Personality</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="mt-6">
                    <Card>
                      <CardContent className="pt-6">
                        <JobSeekerProfileForm 
                          importedData={importedData}
                          onDataImport={setImportedData}
                          onImportPersisted={() => setRefreshTrigger((n) => n + 1)}
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

                  <TabsContent value="security" className="mt-6">
                    <MfaSettings />
                  </TabsContent>

                  <TabsContent value="work" className="mt-6">
                    <WorkExperienceForm 
                      key={`work-${importedData?.parsedData?.workExperience?.length || 0}`}
                      refreshKey={refreshTrigger}
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
                      refreshKey={refreshTrigger}
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
                        
                        // After saving education, move to volunteering
                        setActiveTab('volunteering');
                        toast({
                          title: 'Education saved!',
                          description: 'Add volunteering next (optional), then languages.',
                          duration: 3000,
                        });
                        setRefreshTrigger(prev => prev + 1);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="volunteering" className="mt-6">
                    <VolunteeringForm
                      onSaveComplete={() => {
                        setActiveTab('languages');
                        toast({
                          title: 'Volunteering saved!',
                          description: 'Now add your languages.',
                          duration: 3000,
                        });
                        setRefreshTrigger((prev) => prev + 1);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="languages" className="mt-6">
                    <LanguagesForm
                      importedData={importedData?.parsedData?.languages}
                      onSaveComplete={() => {
                        setActiveTab('certifications');
                        toast({
                          title: 'Languages saved!',
                          description: 'Continue with certifications.',
                          duration: 3000,
                        });
                        setRefreshTrigger((prev) => prev + 1);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="certifications" className="mt-6">
                    <CertificationsForm 
                      key={`certifications-${importedData?.parsedData?.certifications?.length || 0}`}
                      refreshKey={refreshTrigger}
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
                        
                        // After saving certifications, always move to references
                        setActiveTab('references');
                        toast({
                          title: 'Certifications saved!',
                          description: 'Add professional references to strengthen your profile.',
                          duration: 3000,
                        });
                        setRefreshTrigger(prev => prev + 1);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="references" className="mt-6">
                    <ReferencesForm 
                      onSaveComplete={() => {
                        // After saving references, move to skills profile
                        setActiveTab('skills-profile');
                        toast({
                          title: 'References saved!',
                          description: 'Now complete your skills profile.',
                          duration: 3000,
                        });
                        setRefreshTrigger(prev => prev + 1);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="skills-profile" className="mt-6">
                    <SkillsProfileForm 
                      parsedData={importedData?.parsedData?.skills_dimensions}
                      onSaveComplete={() => {
                        // After saving skills profile, move to AI skills
                        setActiveTab('ai-skills');
                        toast({
                          title: 'Skills profile saved!',
                          description: 'Now add your AI fluency details.',
                          duration: 3000,
                        });
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

                  <TabsContent value="personality" className="mt-6">
                    <PersonalityTest onSaveAndExit={() => setIsEditMode(false)} />
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="pt-6">
                      <OrganizationProfileForm />
                    </CardContent>
                  </Card>
                  <MfaSettings />
                </div>
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
