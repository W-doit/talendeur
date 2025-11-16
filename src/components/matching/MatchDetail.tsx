
import React from 'react';
import { useAuth, JobSeekerProfile, OrganizationProfile } from '@/contexts/AuthContext';
import { useMatch, Match } from '@/contexts/MatchContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';

interface MatchDetailProps {
  matchId: string;
  onBack: () => void;
}

const MatchDetail: React.FC<MatchDetailProps> = ({ matchId, onBack }) => {
  const { user } = useAuth();
  const { getMatchDetails } = useMatch();
  const { match, profile } = getMatchDetails(matchId);
  
  if (!match || !profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Match not found</p>
          <Button onClick={onBack} className="mt-4">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const isMutualMatch = match.jobSeekerApproved && match.organizationApproved;
  const isJobSeeker = 'skills' in profile;

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          className="mr-2" 
          size="sm" 
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Match Details</h2>
      </div>

      <Card className="overflow-hidden">
        <div className="relative">
          <img
            src={isJobSeeker ? profile.profilePic : profile.logo}
            alt={profile.name}
            className={`w-full ${isJobSeeker ? 'h-64 object-cover' : 'h-48 object-contain bg-white p-4'}`}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <h3 className="text-2xl font-bold text-white">{profile.name}</h3>
          </div>
        </div>

        <CardContent className="p-6">
          {isJobSeeker ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-sm">{(profile as JobSeekerProfile).bio}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Skills</h3>
                <div className="space-y-3">
                  {Object.entries((profile as JobSeekerProfile).skills).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">{key}</span>
                        <span>{value}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-talendeur-primary to-talendeur-orange h-2 rounded-full" 
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {(profile as JobSeekerProfile).interests.map((interest, i) => (
                    <span 
                      key={i}
                      className="bg-muted px-3 py-1 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-sm">{(profile as OrganizationProfile).about}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Website</h3>
                <a 
                  href={(profile as OrganizationProfile).website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-talendeur-orange hover:underline"
                >
                  {(profile as OrganizationProfile).website}
                </a>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Current Needs</h3>
                <div className="flex flex-wrap gap-2">
                  {(profile as OrganizationProfile).needs.map((need, i) => (
                    <span 
                      key={i}
                      className="bg-muted px-3 py-1 rounded-full text-sm"
                    >
                      {need}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {isMutualMatch && (
            <div className="mt-8 pt-6 border-t border-muted">
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <a 
                href={`mailto:${profile.email}`}
                className="flex items-center bg-talendeur-primary text-white font-medium py-2 px-4 rounded-lg hover:bg-talendeur-primary-dark transition-colors w-fit"
              >
                <Mail className="h-5 w-5 mr-2" />
                {profile.email}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchDetail;
