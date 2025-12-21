
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMatch } from '@/contexts/MatchContext';
import MainLayout from '@/components/layout/MainLayout';
import MatchCard from '@/components/matching/MatchCard';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const FindMatches: React.FC = () => {
  const { user } = useAuth();
  const { currentPotential, approve, reject, loading, loadMorePotentials } = useMatch();
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
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-2">Find {user.userType === 'jobseeker' ? 'Organisations' : 'Talent'}</h1>
        <p className="text-muted-foreground mb-8">
          Swipe right to express interest, or left to pass
        </p>
        
        <div className="flex flex-col items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 border-4 border-talendeur-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-lg">Loading potential matches...</p>
            </div>
          ) : currentPotential ? (
            <MatchCard 
              profile={currentPotential}
              onApprove={approve}
              onReject={reject}
            />
          ) : (
            <div className="text-center py-16">
              <h3 className="text-2xl font-bold mb-4">No more profiles to show</h3>
              <p className="text-muted-foreground mb-6">
                You've gone through all available profiles. Check back later or refresh to see if there are any new matches.
              </p>
              <Button 
                onClick={loadMorePotentials}
                className="bg-talendeur-primary hover:bg-talendeur-primary-dark"
                disabled={loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Profiles
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default FindMatches;
