
import React, { useState } from 'react';
import { JobSeekerProfile, OrganizationProfile } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';

interface MatchCardProps {
  profile: JobSeekerProfile | OrganizationProfile;
  onApprove: () => void;
  onReject: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ profile, onApprove, onReject }) => {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  
  const handleApprove = () => {
    setAction('approve');
    setTimeout(() => {
      onApprove();
    }, 500);
  };
  
  const handleReject = () => {
    setAction('reject');
    setTimeout(() => {
      onReject();
    }, 500);
  };
  
  // Determine if profile is a job seeker or organization
  const isJobSeeker = 'skills' in profile;
  
  return (
    <div 
      className={`w-full max-w-md bg-white dark:bg-talendeur-dark rounded-xl shadow-xl overflow-hidden transform transition-all duration-300
      ${action === 'approve' ? 'animate-swipe-right' : ''}
      ${action === 'reject' ? 'animate-swipe-left' : ''}
      `}
    >
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
      
      <div className="p-5">
        {isJobSeeker ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">{(profile as JobSeekerProfile).bio}</p>
            
            <div className="space-y-3 mb-4">
              <h4 className="font-medium">Skills Assessment</h4>
              
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
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {(profile as JobSeekerProfile).interests.map((interest, i) => (
                  <span 
                    key={i}
                    className="bg-muted px-2 py-1 rounded-full text-xs"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{(profile as OrganizationProfile).about}</p>
            
            <div className="mb-4">
              <h4 className="font-medium mb-1">Website</h4>
              <a 
                href={(profile as OrganizationProfile).website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-talendeur-orange hover:underline text-sm"
              >
                {(profile as OrganizationProfile).website}
              </a>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">Current Needs</h4>
              <div className="flex flex-wrap gap-2">
                {(profile as OrganizationProfile).needs.map((need, i) => (
                  <span 
                    key={i}
                    className="bg-muted px-2 py-1 rounded-full text-xs"
                  >
                    {need}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="flex justify-center gap-4 p-5 bg-muted/30">
        <Button 
          onClick={handleReject}
          variant="outline" 
          size="lg"
          className="rounded-full h-14 w-14 p-0 border-2 border-muted hover:border-red-500 hover:bg-red-500 hover:text-white"
        >
          <X className="h-6 w-6" />
        </Button>
        <Button 
          onClick={handleApprove}
          variant="outline" 
          size="lg"
          className="rounded-full h-14 w-14 p-0 border-2 border-muted hover:border-green-500 hover:bg-green-500 hover:text-white"
        >
          <Check className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default MatchCard;
