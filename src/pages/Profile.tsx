
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import JobSeekerProfileForm from '@/components/profile/JobSeekerProfileForm';
import OrganizationProfileForm from '@/components/profile/OrganizationProfileForm';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if no user
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto py-12 px-4">
        {/* <h1 className="text-3xl font-bold mb-2">{user.profile?.name || 'My Profile'}</h1>
        <p className="text-muted-foreground mb-8">
          {user.userType === 'jobseeker' 
            ? 'Showcase your skills and experience to potential employers' 
            : 'Highlight your organization to attract the best talent'
          }
        </p> */}
        
        {!user.profile ? (
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                {user.userType === 'jobseeker'
                  ? 'Tell us about yourself to start matching with organizations'
                  : 'Tell us about your organization to start finding talent'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.userType === 'jobseeker' ? <JobSeekerProfileForm /> : <OrganizationProfileForm />}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-talendeur-red to-talendeur-orange p-6 rounded-xl shadow-md text-white">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <img 
                    src={user.userType === 'jobseeker' 
                      ? (user.profile as any).profilePic 
                      : (user.profile as any).logo
                    } 
                    alt={user.profile.name}
                    className={`${user.userType === 'jobseeker' 
                      ? 'h-28 w-28 rounded-full object-cover border-4 border-white' 
                      : 'h-28 w-28 rounded-lg bg-white p-2 object-contain'
                    }`}
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold">Hello, {user.profile.name}</h2>
                  <p className="text-white/80">{user.email}</p>
                  <div className="mt-4">
                    {/* <Button 
                      onClick={() => navigate('/find')}
                      className="bg-white text-talendeur-red hover:bg-white/90"
                    >
                      Find {user.userType === 'jobseeker' ? 'Organizations' : 'Talent'}
                    </Button> */}
                  </div>
                </div>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your information</CardDescription>
              </CardHeader>
              <CardContent>
                {user.userType === 'jobseeker' ? <JobSeekerProfileForm /> : <OrganizationProfileForm />}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Profile;
