import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth, JobSeekerProfile, OrganizationProfile } from './AuthContext';
import { useToast } from "@/components/ui/use-toast";

export interface Match {
  id: string;
  jobSeekerId: string;
  organizationId: string;
  jobSeekerApproved: boolean;
  organizationApproved: boolean;
  createdAt: Date;
}

interface MatchContextType {
  potentialMatches: JobSeekerProfile[] | OrganizationProfile[];
  currentPotential: JobSeekerProfile | OrganizationProfile | null;
  matches: Match[];
  loading: boolean;
  approve: () => Promise<void>;
  reject: () => Promise<void>;
  loadMorePotentials: () => Promise<void>;
  getMatchDetails: (matchId: string) => {
    match: Match | undefined;
    profile: JobSeekerProfile | OrganizationProfile | undefined;
  };
}

// Mock matches data
const mockMatches: Match[] = [
  {
    id: 'm1',
    jobSeekerId: '1',
    organizationId: '1',
    jobSeekerApproved: true,
    organizationApproved: true,
    createdAt: new Date('2023-01-15')
  },
  {
    id: 'm2',
    jobSeekerId: '2',
    organizationId: '1',
    jobSeekerApproved: true,
    organizationApproved: false,
    createdAt: new Date('2023-01-20')
  },
  {
    id: 'm3',
    jobSeekerId: '1',
    organizationId: '2',
    jobSeekerApproved: false,
    organizationApproved: true,
    createdAt: new Date('2023-01-25')
  }
];

// Default context
const MatchContext = createContext<MatchContextType>({
  potentialMatches: [],
  currentPotential: null,
  matches: [],
  loading: false,
  approve: async () => {},
  reject: async () => {},
  loadMorePotentials: async () => {},
  getMatchDetails: () => ({ match: undefined, profile: undefined })
});

// Mock data
const allJobSeekers: JobSeekerProfile[] = [
  {
    id: '1',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    profilePic: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1000&auto=format&fit=crop',
    cv: '/mock-cv-alex.pdf',
    interests: ['Full-stack Development', 'AI Research', 'Cloud Architecture'],
    skills: {
      soft: 85,
      hard: 92,
      feedback: 78,
      learning: 90
    },
    bio: 'Full-stack developer with 5+ years of experience in React, Node.js, and cloud technologies. Passionate about creating intuitive user experiences and solving complex problems.'
  },
  {
    id: '2',
    name: 'Jamie Rivera',
    email: 'jamie@example.com',
    profilePic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
    cv: '/mock-cv-jamie.pdf',
    interests: ['UX/UI Design', 'Product Management', 'Data Visualization'],
    skills: {
      soft: 95,
      hard: 83,
      feedback: 90,
      learning: 87
    },
    bio: 'UX/UI designer with a background in cognitive psychology. I create human-centered designs that balance business needs with user satisfaction.'
  },
  {
    id: '3',
    name: 'Jordan Smith',
    email: 'jordan@example.com',
    profilePic: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop',
    cv: '/mock-cv-jordan.pdf',
    interests: ['Data Science', 'Machine Learning', 'Big Data'],
    skills: {
      soft: 80,
      hard: 95,
      feedback: 85,
      learning: 92
    },
    bio: 'Data scientist with expertise in machine learning and predictive modeling. Experienced in turning complex data into actionable insights for business growth.'
  }
];

const allOrganizations: OrganizationProfile[] = [
  {
    id: '1',
    name: 'TechVision Inc.',
    email: 'hr@techvision.com',
    logo: 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?q=80&w=1000&auto=format&fit=crop',
    website: 'https://techvision.example.com',
    about: 'Leading software development company specializing in AI solutions and cloud architecture.',
    needs: ['Full-stack Developer', 'AI Engineer', 'UX Designer']
  },
  {
    id: '2',
    name: 'CreativeWorks Studio',
    email: 'talent@creativeworks.com',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=1000&auto=format&fit=crop',
    website: 'https://creativeworks.example.com',
    about: 'Design-focused agency working with global brands to create memorable digital experiences.',
    needs: ['UX/UI Designer', 'Frontend Developer', 'Product Manager']
  },
  {
    id: '3',
    name: 'DataInsight Labs',
    email: 'careers@datainsight.com',
    logo: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=1000&auto=format&fit=crop',
    website: 'https://datainsight.example.com',
    about: 'Analytics company transforming big data into actionable business intelligence.',
    needs: ['Data Scientist', 'ML Engineer', 'Data Analyst']
  }
];

// Provider component
export const MatchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [potentialMatches, setPotentialMatches] = useState<JobSeekerProfile[] | OrganizationProfile[]>([]);
  const [currentPotential, setCurrentPotential] = useState<JobSeekerProfile | OrganizationProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Load potential matches based on user type
  useEffect(() => {
    if (user) {
      loadPotentialMatches();
    }
  }, [user]);

  const loadPotentialMatches = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (user?.userType === 'jobseeker') {
        // Job seeker sees organizations
        setPotentialMatches(allOrganizations);
        if (allOrganizations.length > 0) {
          setCurrentPotential(allOrganizations[0]);
        }
      } else if (user?.userType === 'organization') {
        // Organization sees job seekers
        setPotentialMatches(allJobSeekers);
        if (allJobSeekers.length > 0) {
          setCurrentPotential(allJobSeekers[0]);
        }
      }

      // Load any existing matches
      const userMatches = mockMatches.filter(match => {
        if (user.userType === 'jobseeker') {
          return match.jobSeekerId === user.id;
        } else {
          return match.organizationId === user.id;
        }
      });
      
      setMatches(userMatches);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load potential matches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approve = async () => {
    if (!user || !currentPotential) return;
    
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create or update match record
      let existingMatch: Match | undefined;
      
      if (user.userType === 'jobseeker') {
        existingMatch = mockMatches.find(
          m => m.jobSeekerId === user.id && m.organizationId === currentPotential.id
        );
      } else {
        existingMatch = mockMatches.find(
          m => m.organizationId === user.id && m.jobSeekerId === currentPotential.id
        );
      }
      
      if (existingMatch) {
        // Update existing match
        const updatedMatches = matches.map(match => {
          if (match.id === existingMatch?.id) {
            if (user.userType === 'jobseeker') {
              match.jobSeekerApproved = true;
            } else {
              match.organizationApproved = true;
            }
          }
          return match;
        });
        
        setMatches(updatedMatches);
        
        // Check if this created a mutual match
        const isNowMutualMatch = updatedMatches.some(match => 
          match.id === existingMatch?.id && 
          match.jobSeekerApproved && 
          match.organizationApproved
        );
        
        if (isNowMutualMatch) {
          toast({
            title: "It's a match!",
            description: `You matched with ${currentPotential.name}!`,
          });
        }
      } else {
        // Create new match
        const newMatch: Match = {
          id: `m${Math.random().toString(36).substr(2, 9)}`,
          jobSeekerId: user.userType === 'jobseeker' ? user.id : currentPotential.id,
          organizationId: user.userType === 'organization' ? user.id : currentPotential.id,
          jobSeekerApproved: user.userType === 'jobseeker',
          organizationApproved: user.userType === 'organization',
          createdAt: new Date()
        };
        
        setMatches([...matches, newMatch]);
      }

      // Move to next potential match
      moveToNextPotential();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your response",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reject = async () => {
    if (!currentPotential) return;
    
    // Simply move to the next potential match
    moveToNextPotential();
  };

  const moveToNextPotential = () => {
    if (potentialMatches.length <= 1) {
      setCurrentPotential(null);
      return;
    }
    
    const currentIndex = potentialMatches.findIndex(p => p.id === currentPotential?.id);
    if (currentIndex >= 0 && currentIndex < potentialMatches.length - 1) {
      setCurrentPotential(potentialMatches[currentIndex + 1]);
    } else {
      setCurrentPotential(null);
    }
    
    // Fix the type issue by ensuring we return the same type as input
    setPotentialMatches((prev) => {
      // Check what kind of profiles we're dealing with
      if (prev.length > 0) {
        // If the array is not empty, filter out the current potential
        if ('profilePic' in prev[0]) {
          // We have JobSeekerProfile[]
          return (prev as JobSeekerProfile[]).filter(
            p => p.id !== currentPotential?.id
          );
        } else {
          // We have OrganizationProfile[]
          return (prev as OrganizationProfile[]).filter(
            p => p.id !== currentPotential?.id
          );
        }
      }
      return prev;
    });
  };

  const loadMorePotentials = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would fetch more profiles from the backend
      // For now, we'll just reset with the original data
      if (user?.userType === 'jobseeker') {
        setPotentialMatches(allOrganizations);
        if (allOrganizations.length > 0) {
          setCurrentPotential(allOrganizations[0]);
        }
      } else if (user?.userType === 'organization') {
        setPotentialMatches(allJobSeekers);
        if (allJobSeekers.length > 0) {
          setCurrentPotential(allJobSeekers[0]);
        }
      }
      
      toast({
        title: "Profiles refreshed",
        description: "New potential matches are available",
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load more profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMatchDetails = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    
    if (!match) {
      return { match: undefined, profile: undefined };
    }
    
    let profile;
    if (user?.userType === 'jobseeker') {
      profile = allOrganizations.find(org => org.id === match.organizationId);
    } else {
      profile = allJobSeekers.find(js => js.id === match.jobSeekerId);
    }
    
    return { match, profile };
  };

  return (
    <MatchContext.Provider value={{
      potentialMatches,
      currentPotential,
      matches,
      loading,
      approve,
      reject,
      loadMorePotentials,
      getMatchDetails
    }}>
      {children}
    </MatchContext.Provider>
  );
};

// Custom hook for using the match context
export const useMatch = () => useContext(MatchContext);
