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
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userType: UserType) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<JobSeekerProfile> | Partial<OrganizationProfile>) => Promise<void>;
  createProfile: (userType: UserType) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  accessToken: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  createProfile: async () => false,
  resetPassword: async () => {},
  updatePassword: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { toast } = useToast();

  // Load user profile from Supabase
  const loadUserProfile = async (supabaseUser: User, accessToken?: string) => {
    console.log('loadUserProfile called for user:', supabaseUser.id);
    console.log('User email:', supabaseUser.email);
    console.log('Has access token:', !!accessToken);
    try {
      // Get profile from database using direct API
      console.log('Fetching profile from database via REST API...');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Use the user's access token if available (for RLS policies)
      const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${supabaseKey}`;
      console.log('Using auth header with', accessToken ? 'user access token' : 'anon key');
      
      // Try fetching by email first (more reliable)
      console.log('Trying to fetch profile by email:', supabaseUser.email);
      let profileResponse = await fetch(
        `${supabaseUrl}/rest/v1/profile?email=eq.${supabaseUser.email}&select=*`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': authHeader,
          }
        }
      );
      
      let profileDataArray = await profileResponse.json();
      console.log('Profile fetch by email result:', { status: profileResponse.status, count: profileDataArray?.length, data: profileDataArray });
      
      // If not found by email, try by user_id
      if (!profileDataArray || profileDataArray.length === 0) {
        console.log('Not found by email, trying by user_id:', supabaseUser.id);
        profileResponse = await fetch(
          `${supabaseUrl}/rest/v1/profile?user_id=eq.${supabaseUser.id}&select=*`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': authHeader,
            }
          }
        );
        
        profileDataArray = await profileResponse.json();
        console.log('Profile fetch by user_id result:', { status: profileResponse.status, count: profileDataArray?.length });
      }
      
      if (!profileResponse.ok) {
        console.error('Error loading profile:', profileDataArray);
        return null;
      }

      const profileData = profileDataArray[0];
      if (!profileData) {
        console.log('No profile found for user:', supabaseUser.id, 'or email:', supabaseUser.email);
        return null;
      }

      console.log('Profile found! user_id in profile:', profileData.user_id);
      const userType = profileData.user_type as UserType;
      let fullProfile: JobSeekerProfile | OrganizationProfile | null = null;

      if (userType === 'jobseeker') {
        console.log('Loading jobseeker skill ratings...');
        // Load jobseeker skill ratings via REST API - use the user_id from the profile
        const skillResponse = await fetch(
          `${supabaseUrl}/rest/v1/jobseeker_skill_rating?user_id=eq.${profileData.user_id}&select=*`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': authHeader,
            }
          }
        );
        
        const skillDataArray = await skillResponse.json();
        const skillData = skillDataArray[0];
        console.log('Skill data loaded:', !!skillData);

        fullProfile = {
          id: profileData.user_id,
          name: `${profileData.first_name} ${profileData.surname}`.trim(),
          email: profileData.email,
          headline: profileData.headline || undefined,
          profilePic: profileData.profile_pic || '',
          cv: profileData.cv_url || '',
          videoUrl: profileData.video_url || '',
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
        console.log('Loading organization details...');
        // Load organization details via REST API - use the user_id from the profile
        const orgResponse = await fetch(
          `${supabaseUrl}/rest/v1/organization_details?organization_id=eq.${profileData.user_id}&select=*`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': authHeader,
            }
          }
        );
        
        const orgDataArray = await orgResponse.json();
        const orgData = orgDataArray[0];
        console.log('Organization data loaded:', !!orgData);

        fullProfile = {
          id: profileData.user_id,
          name: orgData?.company_name || '',
          email: profileData.email,
          headline: profileData.headline || undefined,
          logo: orgData?.logo || '',
          videoUrl: profileData.video_url || '',
          website: orgData?.website || '',
          about: orgData?.about || '',
          needs: orgData?.needs || [],
        };
      }

      console.log('Returning full user data');
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
        // Store access token
        if (session.access_token) {
          setAccessToken(session.access_token);
        }
        
        loadUserProfile(session.user, session.access_token).then((userData) => {
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
        // Store access token
        if (session.access_token) {
          setAccessToken(session.access_token);
        }
        
        const userData = await loadUserProfile(session.user, session.access_token);
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
    setLoading(true);
    
    try {
      console.log('Login attempt:', { email, hasPassword: !!password });
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      
      // Use direct API call to avoid hanging
      console.log('Using direct API call for login...');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Direct API login response:', { status: response.status, hasUser: !!data.user });

      if (!response.ok) {
        console.error('Login error:', data);
        toast({
          title: "Login failed",
          description: data.error_description || data.msg || "Invalid email or password",
          variant: "destructive",
        });
        throw new Error(data.error_description || 'Login failed');
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
      
      // Store tokens for later use
      const userAccessToken = data.access_token;
      const refreshToken = data.refresh_token;
      
      // Store access token in state
      setAccessToken(userAccessToken);
      
      // Set the session in Supabase client for subsequent requests
      if (userAccessToken && refreshToken) {
        console.log('Setting session with tokens...');
        // Don't await this - just fire and forget to avoid hanging
        supabase.auth.setSession({
          access_token: userAccessToken,
          refresh_token: refreshToken,
        }).catch(err => console.warn('setSession warning:', err));
      }

      // Set basic user data immediately
      const basicUser = {
        id: data.user.id,
        email: data.user.email!,
        userType: 'jobseeker' as UserType,
        profile: null,
      };
      
      console.log('Setting user state with basic data');
      setUser(basicUser);
      
      // Try to load profile in background (non-blocking) - pass the access token
      loadUserProfile(data.user, userAccessToken).then((userData) => {
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
    } finally {
      setLoading(false);
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
      // Clear state immediately
      setUser(null);
      setAccessToken(null);
      
      // Clear all Supabase-related data from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase')) {
          localStorage.removeItem(key);
        }
      });
      
      // Sign out from Supabase (don't wait if it hangs)
      supabase.auth.signOut().catch(err => console.warn('SignOut warning:', err));
      
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

      if ('videoUrl' in profileData) {
        profileUpdate.video_url = profileData.videoUrl;
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
      // Reload user profile with access token
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session?.access_token) {
        const userData = await loadUserProfile(session.user, session.access_token);
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

  // Request password reset email
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Check your email",
        description: "Password reset instructions have been sent to your email",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Update user password
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Password update failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated",
      });
    } catch (error: any) {
      console.error('Password update error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        login,
        register,
        logout,
        updateProfile,
        createProfile,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
