
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, ArrowLeft } from 'lucide-react';

const FindMatches: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if no user
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!user.profile) {
      navigate('/profile');
    }
  }, [user, navigate]);
  
  if (!user || !user.profile) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-talendeur-orange to-talendeur-primary p-4 rounded-full">
                <Rocket className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Coming Soon!</CardTitle>
            <CardDescription className="text-lg mt-2">
              The matching feature is currently under development
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">
              We're working hard to bring you an amazing experience to find {user.userType === 'jobseeker' ? 'organizations' : 'talented professionals'}. 
              Stay tuned!
            </p>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-talendeur-primary">
                What's Coming:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✨ AI-powered matching algorithm</li>
                <li>💬 Direct messaging with matches</li>
                <li>📊 Compatibility scores</li>
                <li>🎯 Smart recommendations</li>
              </ul>
            </div>
            <Button
              onClick={() => navigate('/profile')}
              className="bg-talendeur-primary hover:bg-talendeur-primary-dark text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default FindMatches;
