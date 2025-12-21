import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Types
export type UserType = 'jobseeker' | 'organization';

export interface JobSeekerProfile {
  id: string;
  name: string;
  email: string;
  headline?: string;
  profilePic: string;
  cv: string;
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
  headline?: string;
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
  register: (email: string, password: string, userType: UserType) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<JobSeekerProfile> | Partial<OrganizationProfile>) => Promise<void>;
  createProfile: (userType: UserType) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  createProfile: async () => false,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Load user profile from Supabase
  const loadUserProfile = async (supabaseUser: User) => {
    try {
      // Get profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('profile')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error if no rows

      if (profileError) {
        console.error('Error loading profile:', profileError);
        return null;
      }

      if (!profileData) {
        console.log('No profile found for user:', supabaseUser.id);
        return null;
      }

      const userType = profileData.user_type as UserType;
      let fullProfile: JobSeekerProfile | OrganizationProfile | null = null;

      if (userType === 'jobseeker') {
        // Load jobseeker skill ratings
        const { data: skillData } = await supabase
          .from('jobseeker_skill_rating')
          .select('*')
          .eq('user_id', supabaseUser.id)
          .maybeSingle();

        fullProfile = {
          id: profileData.user_id,
          name: `${profileData.first_name} ${profileData.surname}`.trim(),
          email: profileData.email,
          headline: profileData.headline || undefined,
          profilePic: profileData.profile_pic || '',
          cv: profileData.cv_url || '',
          interests: skillData?.interests || [],
          skills: {
            soft: skillData?.soft_skills || 70,
            hard: skillData?.hard_skills || 70,
            feedback: skillData?.feedback_score || 70,
            learning: skillData?.learning_score || 70,
          },
          bio: profileData.bio || '',
        };
      } else {
        // Load organization details
        const { data: orgData } = await supabase
          .from('organization_details')
          .select('*')
          .eq('organization_id', supabaseUser.id)
          .maybeSingle();

        fullProfile = {
          id: profileData.user_id,
          name: orgData?.company_name || '',
          email: profileData.email,
          headline: profileData.headline || undefined,
          logo: orgData?.logo || '',
          website: orgData?.website || '',
          about: orgData?.about || '',
          needs: orgData?.needs || [],
        };
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        userType,
        profile: fullProfile,
      };
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  };

  // Check auth state on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user).then((userData) => {
          if (!userData || !userData.profile) {
            // User authenticated but no profile
            setUser({
              id: session.user.id,
              email: session.user.email!,
              userType: 'jobseeker',
              profile: null,
            });
          } else {
            setUser(userData);
          }
        });
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userData = await loadUserProfile(session.user);
        if (!userData || !userData.profile) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            userType: 'jobseeker',
            profile: null,
          });
        } else {
          setUser(userData);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Create profile in database
  const createProfile = async (userType: UserType): Promise<boolean> => {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (!supabaseUser) {
        console.error('No authenticated user found');
        throw new Error('No authenticated user');
      }

      console.log('Creating profile for user:', supabaseUser.id, 'Type:', userType);

      // Create profile record
      const { data: profileData, error: profileError } = await supabase
        .from('profile')
        .insert({
          user_id: supabaseUser.id,
          first_name: '',
          surname: '',
          email: supabaseUser.email!,
          user_type: userType,
          bio: '',
          profile_pic: '',
          cv_url: '',
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      console.log('Profile created successfully:', profileData);

      if (userType === 'jobseeker') {
        // Create jobseeker skill rating
        const { error: skillError } = await supabase
          .from('jobseeker_skill_rating')
          .insert({
            user_id: supabaseUser.id,
            interests: [],
            soft_skills: 70,
            hard_skills: 70,
            feedback_score: 70,
            learning_score: 70,
          });

        if (skillError) {
          console.error('Skill rating creation error:', skillError);
          // Don't throw - skill rating is optional
        } else {
          console.log('Skill rating created successfully');
        }
      } else {
        // Create organization details
        const { error: orgError } = await supabase
          .from('organization_details')
          .insert({
            organization_id: supabaseUser.id,
            company_name: '',
            needs: [],
          });

        if (orgError) {
          console.error('Organization details creation error:', orgError);
          // Don't throw - org details can be added later
        } else {
          console.log('Organization details created successfully');
        }
      }

      console.log('Profile creation completed successfully');
      return true;
    } catch (error) {
      console.error('Create profile error:', error);
      return false;
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    console.log('Login function called for:', email);
    
    try {
      console.log('Login attempt:', { email, hasPassword: !!password });
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      
      // Clear any existing session first to prevent conflicts
      await supabase.auth.signOut();
      
      console.log('Calling signInWithPassword...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Supabase response received:', { hasData: !!data, hasError: !!error });

      if (error) {
        console.error('Supabase auth error:', error);
        toast({
          title: "Login failed",
          description: error.message || "Invalid email or password",
          variant: "destructive",
        });
        throw error;
      }

      if (!data.user) {
        console.error('No user in response data');
        toast({
          title: "Login failed",
          description: "No user data returned",
          variant: "destructive",
        });
        throw new Error('No user data returned');
      }

      console.log('Login successful, user ID:', data.user.id);

      // Set basic user data immediately
      const basicUser = {
        id: data.user.id,
        email: data.user.email!,
        userType: 'jobseeker' as UserType,
        profile: null,
      };
      
      console.log('Setting user state with basic data');
      setUser(basicUser);
      
      // Try to load profile in background (non-blocking)
      loadUserProfile(data.user).then((userData) => {
        if (userData && userData.profile) {
          console.log('Profile loaded successfully');
          setUser(userData);
        } else {
          console.log('No profile found - user needs to create one');
        }
      }).catch(err => {
        console.error('Error loading profile (non-blocking):', err);
      });
      
      console.log('Showing success toast');
      toast({
        title: "Login successful",
        description: "Welcome to Talendeur!",
      });
      
      console.log('Login function completed successfully');
    } catch (error: any) {
      console.error('Login error caught:', error);
      throw error;
    }
  };

  // Register
  const register = async (email: string, password: string, userType: UserType) => {
    setLoading(true);

    try {
      console.log('Starting Supabase signup...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Supabase signup error:', error);
        throw error;
      }

      console.log('Supabase signup response:', data);

      if (data.user) {
        console.log('User created, creating profile...');
        // Create profile
        const profileCreated = await createProfile(userType);
        
        console.log('Profile created:', profileCreated);
        
        if (profileCreated) {
          // Load the user profile immediately after creation
          console.log('Loading user profile...');
          const authUser = await loadUserProfile(data.user);
          if (authUser) {
            console.log('User profile loaded:', authUser);
            setUser(authUser);
          }
        }

        toast({
          title: "Registration successful",
          description: "Your account has been created. You can now complete your profile.",
        });
      } else {
        console.log('No user in signup response');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Could not create your account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      
      // Clear all Supabase-related data from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase')) {
          localStorage.removeItem(key);
        }
      });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "Could not log out",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (profileData: Partial<JobSeekerProfile> | Partial<OrganizationProfile>) => {
    console.log('updateProfile called with data:', profileData);
    
    if (!user) {
      toast({
        title: "Update failed",
        description: "You must be logged in",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Starting profile update for user:', user.id);
      
      // Update profile table
      const profileUpdate: any = {
        bio: (profileData as any).bio,
        profile_pic: (profileData as any).profilePic || (profileData as any).logo,
      };

      if ('headline' in profileData) {
        profileUpdate.headline = profileData.headline;
      }

      if ('name' in profileData && profileData.name) {
        const names = profileData.name.split(' ');
        profileUpdate.first_name = names[0] || '';
        profileUpdate.surname = names.slice(1).join(' ') || '';
      }

      if ('cv' in profileData) {
        profileUpdate.cv_url = profileData.cv;
      }

      console.log('Updating profile table with:', profileUpdate);

      const { error: profileError } = await supabase
        .from('profile')
        .update(profileUpdate)
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Profile table update error:', profileError);
        throw profileError;
      }

      console.log('Profile table updated successfully');

      // Update type-specific tables only if relevant data is provided
      if (user.userType === 'jobseeker' && 'skills' in profileData && profileData.skills) {
        console.log('Updating jobseeker skills');
        const skillUpdate = {
          interests: (profileData as JobSeekerProfile).interests,
          soft_skills: profileData.skills?.soft,
          hard_skills: profileData.skills?.hard,
          feedback_score: profileData.skills?.feedback,
          learning_score: profileData.skills?.learning,
        };

        const { error: skillError } = await supabase
          .from('jobseeker_skill_rating')
          .update(skillUpdate)
          .eq('user_id', user.id);

        if (skillError) {
          console.error('Skill rating update error:', skillError);
          throw skillError;
        }
        console.log('Jobseeker skills updated successfully');
        console.log('Jobseeker skills updated successfully');
      } else if (user.userType === 'organization') {
        console.log('Updating organization details');
        const orgUpdate: any = {};
        
        if ('name' in profileData) orgUpdate.company_name = profileData.name;
        if ('logo' in profileData) orgUpdate.logo = (profileData as OrganizationProfile).logo;
        if ('website' in profileData) orgUpdate.website = (profileData as OrganizationProfile).website;
        if ('about' in profileData) orgUpdate.about = (profileData as OrganizationProfile).about;
        if ('needs' in profileData) orgUpdate.needs = (profileData as OrganizationProfile).needs;

        const { error: orgError } = await supabase
          .from('organization_details')
          .update(orgUpdate)
          .eq('organization_id', user.id);

        if (orgError) {
          console.error('Organization details update error:', orgError);
          throw orgError;
        }
        console.log('Organization details updated successfully');
      }

      console.log('Reloading user profile...');
      // Reload user profile
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        const userData = await loadUserProfile(supabaseUser);
        setUser(userData);
        console.log('User profile reloaded successfully');
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
      
      console.log('Profile update completed successfully');
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Update failed",
        description: error.message || "Could not update your profile",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
      console.log('updateProfile finished, loading state reset');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        createProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
