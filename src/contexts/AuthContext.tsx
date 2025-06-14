import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Types
export type UserType = 'jobseeker' | 'organization';

export interface JobSeekerProfile {
  id: string;
  name: string;
  email: string;
  profilePic: string;
  cv: string; // URL to CV
  interests: string[];
  skills: {
    soft: number;
    hard: number;
    feedback: number;
    learning: number;
  };
  bio: string;
}

export interface OrganizationProfile {
  id: string;
  name: string;
  email: string;
  logo: string;
  website: string;
  about: string;
  needs: string[];
}

export type AuthUser = {
  id: string;
  email: string;
  userType: UserType;
  profile: JobSeekerProfile | OrganizationProfile | null;
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  // Register function now includes userType and extra fields
  register: (
    email: string,
    password: string,
    userType: UserType,
    extraFields: { firstName: string; surname: string; companyName: string }
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<JobSeekerProfile> | Partial<OrganizationProfile>) => Promise<void>;
}

// Default context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

// Mock data for two job seekers
const mockJobSeekers: JobSeekerProfile[] = [
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
  }
];

// Mock data for organizations
const mockOrganizations: OrganizationProfile[] = [
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
  }
];

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Simulating auth state check
  useEffect(() => {
    const storedUser = localStorage.getItem('talendeur-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Login process with supabaseAuth
     const { data, error } = await supabase.auth.signInWithPassword({
       email: email,
       password: password
     });

     if(error || !data.user){
      throw error
     }

      let foundUser: AuthUser | null = null;
      
      // Check if user exists in our mock job seekers
      const jobSeeker = mockJobSeekers.find(js => js.email === email);
      if (jobSeeker) {
        foundUser = {
          id: jobSeeker.id,
          email: jobSeeker.email,
          userType: 'jobseeker',
          profile: jobSeeker
        };
      }
      // Trying to swap over mock jobseeker logic, not yet functioning 
    //   const {data: jobSeekerProfile, error: profileError } = await supabase
    //   .from('profile')
    //   .select('*')
    //   .eq('email', email)
    //   .single();

    //   if (jobSeekerProfile) {
    //   foundUser = {
    //     id: data.user.id,
    //     email: data.user.email ?? '',
    //     userType: 'jobseeker',
    //     profile: jobSeekerProfile,
    //   };
    // }
      
      // Check if user exists in our mock organizations
      const organization = mockOrganizations.find(org => org.email === email);
      if (organization) {
        foundUser = {
          id: organization.id,
          email: organization.email,
          userType: 'organization',
          profile: organization
        };
      }
      
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('talendeur-user', JSON.stringify(foundUser));
        toast({
          title: "Login successful",
          description: `Welcome back to Talendeur!`,
        });
      } else {
        throw new Error('Authenticated but user not found in mock data');
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (
    email: string,
    password: string,
    userType: UserType,
    extraFields?: { firstName: string; surname: string; companyName: string }
  ) => {
    setLoading(true);

    try {
      // 1. Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error || !data.user) {
        throw error || new Error("No user returned from signUp");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
  email,
  password,
});

      if (signInError) {
        throw signInError;
      } 


      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

if (sessionError || !session?.user?.id) {
  throw sessionError || new Error("No session or user ID available");
}

const userId = session.user.id;  

      //  Inserting into the correct profile table
      if (userType === "jobseeker") {
        const { firstName = "", surname = "" } = extraFields || {};
        const { error: profileError } = await supabase
          .from("profile")
          .insert([
            {
              user_id: userId,
              first_name: firstName.trim(),
              surname : surname.trim(),
              email: email,
             
            },
          ]);
        if (profileError) throw profileError;
      } else if (userType === "organization") {
        const { companyName = "" } = extraFields || {};
        const { error: orgError } = await supabase
          .from("organization_details")
          .insert([
            {
              organization_id: userId,
              company_name: companyName,
              email,
            
            },
          ]);
        if (orgError) throw orgError;
      }

     
      const newUser: AuthUser = {
        id: userId,
        email,
        userType,
        profile: null,
      };

      setUser(newUser);
      localStorage.setItem("talendeur-user", JSON.stringify(newUser));

      toast({
        title: "Registration successful",
        description: "Your account has been created. Please complete your profile.",
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Could not create your account. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mock logout function
  const logout = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(null);
      localStorage.removeItem('talendeur-user');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Could not log out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock profile update function
  const updateProfile = async (profileData: Partial<JobSeekerProfile> | Partial<OrganizationProfile>) => {
    if (!user) {
      toast({
        title: "Update failed",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUser = {
        ...user,
        profile: {
          ...user.profile,
          ...profileData
        }
      };
      
      setUser(updatedUser);
      localStorage.setItem('talendeur-user', JSON.stringify(updatedUser));
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => useContext(AuthContext);
