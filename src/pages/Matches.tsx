
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMatch } from '@/contexts/MatchContext';
import MainLayout from '@/components/layout/MainLayout';
import MatchList from '@/components/matching/MatchList';
import MatchDetail from '@/components/matching/MatchDetail';

const Matches: React.FC = () => {
  const { user } = useAuth();
  const { matches } = useMatch();
  const navigate = useNavigate();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  
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

  const handleViewMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
  };

  const handleBack = () => {
    setSelectedMatchId(null);
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto py-12 px-4">
        {selectedMatchId ? (
          <MatchDetail matchId={selectedMatchId} onBack={handleBack} />
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">My Matches</h1>
            <p className="text-muted-foreground mb-8">
              View and manage your connections
            </p>
            <MatchList onViewMatch={handleViewMatch} />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Matches;
