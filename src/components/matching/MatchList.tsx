
import React from 'react';
import { useAuth, JobSeekerProfile, OrganizationProfile } from '@/contexts/AuthContext';
import { useMatch, Match } from '@/contexts/MatchContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MatchListProps {
  onViewMatch: (matchId: string) => void;
}

const MatchList: React.FC<MatchListProps> = ({ onViewMatch }) => {
  const { user } = useAuth();
  const { matches, getMatchDetails } = useMatch();
  
  // Get mutual matches (where both parties have approved)
  const mutualMatches = matches.filter(m => m.jobSeekerApproved && m.organizationApproved);
  
  // Get pending matches (where only the current user has approved)
  const pendingMatches = matches.filter(match => {
    if (user?.userType === 'jobseeker') {
      return match.jobSeekerApproved && !match.organizationApproved;
    } else {
      return match.organizationApproved && !match.jobSeekerApproved;
    }
  });

  if (matches.length === 0) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-medium mb-1">No matches yet</h3>
          <p className="text-muted-foreground text-sm">
            Start swiping to find potential matches
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {mutualMatches.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-3">Mutual Matches</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mutualMatches.map(match => {
              const { profile } = getMatchDetails(match.id);
              if (!profile) return null;
              
              return (
                <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex items-center p-4">
                    <div className="flex-shrink-0 mr-3">
                      <img 
                        src={'skills' in profile ? profile.profilePic : profile.logo} 
                        alt={profile.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-md font-medium truncate">{profile.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Matched on {new Date(match.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => onViewMatch(match.id)}
                      className="bg-talendeur-red hover:bg-talendeur-darkred"
                    >
                      View
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      
      {pendingMatches.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-3">Pending Matches</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pendingMatches.map(match => {
              const { profile } = getMatchDetails(match.id);
              if (!profile) return null;
              
              return (
                <Card key={match.id} className="overflow-hidden bg-muted/30">
                  <div className="flex items-center p-4">
                    <div className="flex-shrink-0 mr-3">
                      <img 
                        src={'skills' in profile ? profile.profilePic : profile.logo} 
                        alt={profile.name}
                        className="h-16 w-16 rounded-full object-cover grayscale"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-md font-medium truncate">{profile.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Waiting for response
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchList;
