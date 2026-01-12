
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserType, JobSeekerProfile, OrganizationProfile } from '@/contexts/AuthContext';
import JobSeekerProfileForm from '@/components/profile/JobSeekerProfileForm';
import OrganizationProfileForm from '@/components/profile/OrganizationProfileForm';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyMetricsCards } from '@/components/dashboard/KeyMetricsCards';
import { SkillsRadarChart } from '@/components/dashboard/SkillsRadarChart';
import { WorkExperienceTimeline } from '@/components/dashboard/WorkExperienceTimeline';
import { CertificationsChart } from '@/components/dashboard/CertificationsChart';
import { ESGChart } from '@/components/dashboard/ESGChart';
import { InternationalExperienceMap } from '@/components/dashboard/InternationalExperienceMap';
import { BiographyWordCloud } from '@/components/dashboard/BiographyWordCloud';
import { PersonalityVisualization } from '@/components/dashboard/PersonalityVisualization';
import { WorkExperienceForm } from '@/components/profile/WorkExperienceForm';
import { EducationForm } from '@/components/profile/EducationForm';
import { CertificationsForm } from '@/components/profile/CertificationsForm';
import { ReferencesForm } from '@/components/profile/ReferencesForm';
import { PersonalityTest } from '@/components/profile/PersonalityTest';

const Profile: React.FC = () => {
  const { user, createProfile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedUserType, setSelectedUserType] = useState<UserType>('jobseeker');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [importedData, setImportedData] = useState<any>(null);
  
  // Check if profile has been filled out (has a name or other basic info)
  const hasCompleteProfile = user?.profile && (
    user.profile.name || 
    user.profile.email ||
    (user.profile as any).bio
  );
  
  // Exit edit mode when navigating to profile page
  React.useEffect(() => {
    if (hasCompleteProfile && location.pathname === '/profile') {
      setIsEditMode(false);
    }
  }, [location.pathname, hasCompleteProfile]);
  
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
    } else if (hasCompleteProfile) {
      // Exit edit mode when profile is complete (e.g., when clicking Profile button from header)
      setIsEditMode(false);
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
                  <div className="flex-shrink-0 flex flex-col items-center gap-3">
                    {(() => {
                      const imageUrl = user.userType === 'jobseeker' 
                        ? (user.profile as JobSeekerProfile).profilePic 
                        : (user.profile as OrganizationProfile).logo;
                      
                      if (imageUrl) {
                        return (
                          <img 
                            src={imageUrl}
                            alt={user.profile.name}
                            className={user.userType === 'jobseeker' ? 'h-28 w-28 rounded-full object-cover border-4 border-gray-200' : 'h-28 w-28 rounded-lg object-cover border-4 border-gray-200'}
                          />
                        );
                      } else {
                        return (
                          <div 
                            className={user.userType === 'jobseeker'
                              ? 'h-28 w-28 rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center'
                              : 'h-28 w-28 rounded-lg bg-gray-200 border-4 border-gray-300 flex items-center justify-center'
                            }
                          >
                            <span className="text-4xl font-bold text-gray-600">
                              {user.profile.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        );
                      }
                    })()}
                    <Button 
                      onClick={() => setIsEditMode(true)}
                      size="sm"
                      variant="outline"
                      className="bg-white/70 text-talendeur-primary hover:bg-white/90 border-talendeur-primary"
                    >
                      Edit Profile
                    </Button>
                  </div>
                  <div className="flex-1 text-center md:text-left">
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
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Left column: Timeline (all date-based items) */}
                <div className="w-full md:w-1/3 flex flex-col gap-8">
                    <WorkExperienceTimeline />
                    <CertificationsChart />
                  </div>
                  {/* Right column: Visualizations and info boxes */}
                  <div className="w-full md:w-2/3 flex flex-col gap-8">
                    <KeyMetricsCards />
                    <BiographyWordCloud />
                    <SkillsRadarChart />
                    <PersonalityVisualization />
                    <ESGChart />
                  </div>
              </div>

              {/* Full-width International Experience Map */}
              <div className="w-full">
                <InternationalExperienceMap />
              </div>

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
                      onClick={() => setIsEditMode(false)}
                      size="sm"
                      variant="outline"
                      className="bg-white/70 text-talendeur-primary hover:bg-white/90"
                    >
                      View Profile
                    </Button>
                  )}
                </CardHeader>
              </Card>

              {user.userType === 'jobseeker' ? (
                <Tabs defaultValue="basic" className="w-full" key={isEditMode ? 'edit' : 'view'}>
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="work">Work</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                    <TabsTrigger value="certifications">Certifications</TabsTrigger>
                    <TabsTrigger value="references">References</TabsTrigger>
                    <TabsTrigger value="personality">Personality</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="mt-6">
                    <Card>
                      <CardContent className="pt-6">
                        <JobSeekerProfileForm 
                          onSaveComplete={() => {
                            setIsEditMode(false);
                            setImportedData(null);
                          }}
                          importedData={importedData}
                          onDataImport={setImportedData}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="work" className="mt-6">
                    <WorkExperienceForm 
                      importedData={importedData?.parsedData?.workExperience}
                    />
                  </TabsContent>

                  <TabsContent value="education" className="mt-6">
                    <EducationForm 
                      importedData={importedData?.parsedData?.education}
                    />
                  </TabsContent>

                  <TabsContent value="certifications" className="mt-6">
                    <CertificationsForm />
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
                    <OrganizationProfileForm onSaveComplete={() => setIsEditMode(false)} />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
