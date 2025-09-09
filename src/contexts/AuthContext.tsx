
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
  register: (email: string, password: string, userType: UserType) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<JobSeekerProfile> | Partial<OrganizationProfile>) => Promise<void>;
  createProfile: (userType: UserType) => Promise<boolean>;
  resendConfirmation: (email: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  checkUserStatus: (email: string) => Promise<{ exists: boolean; message: string }>;
}

// Default context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  createProfile: async () => false,
  resendConfirmation: async () => false,
  resetPassword: async () => false,
  checkUserStatus: async () => ({ exists: false, message: '' }),
});

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check auth state on mount
  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch profile
        let profile = null;
        let userType: UserType | null = null;

        const { data: jobSeekerData } = await supabase
          .from('profile')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (jobSeekerData) {
          userType = 'jobseeker';
          // Fetch skills
          const { data: skillsData } = await supabase
            .from('jobseeker_skill_rating')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          profile = {
            id: jobSeekerData.user_id,
            name: `${jobSeekerData.first_name} ${jobSeekerData.surname}`.trim(),
            email: jobSeekerData.email,
            profilePic: jobSeekerData.profile_pic || '',
            cv: jobSeekerData.cv_url || '',
            interests: skillsData?.interests || [],
            skills: {
              soft: skillsData?.soft_skills || 0,
              hard: skillsData?.hard_skills || 0,
              feedback: skillsData?.feedback_score || 0,
              learning: skillsData?.learning_score || 0
            },
            bio: jobSeekerData.bio || ''
          };
        } else {
          const { data: orgData } = await supabase
            .from('organization_details')
            .select('*')
            .eq('organization_id', session.user.id)
            .single();

          if (orgData) {
            userType = 'organization';
            profile = {
              id: orgData.organization_id,
              name: orgData.company_name,
              email: orgData.email,
              logo: orgData.logo || '',
              website: orgData.website || '',
              about: orgData.about || '',
              needs: orgData.needs || []
            };
          }
        }

        if (userType) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            userType,
            profile
          });
        }
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Similar to above
        let profile = null;
        let userType: UserType | null = null;

        const { data: jobSeekerData } = await supabase
          .from('profile')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (jobSeekerData) {
          userType = 'jobseeker';
          // Fetch skills
          const { data: skillsData } = await supabase
            .from('jobseeker_skill_rating')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          profile = {
            id: jobSeekerData.user_id,
            name: `${jobSeekerData.first_name} ${jobSeekerData.surname}`.trim(),
            email: jobSeekerData.email,
            profilePic: jobSeekerData.profile_pic || '',
            cv: jobSeekerData.cv_url || '',
            interests: skillsData?.interests || [],
            skills: {
              soft: skillsData?.soft_skills || 0,
              hard: skillsData?.hard_skills || 0,
              feedback: skillsData?.feedback_score || 0,
              learning: skillsData?.learning_score || 0
            },
            bio: jobSeekerData.bio || ''
          };
        } else {
          const { data: orgData } = await supabase
            .from('organization_details')
            .select('*')
            .eq('organization_id', session.user.id)
            .single();

          if (orgData) {
            userType = 'organization';
            profile = {
              id: orgData.organization_id,
              name: orgData.company_name,
              email: orgData.email,
              logo: orgData.logo || '',
              website: orgData.website || '',
              about: orgData.about || '',
              needs: orgData.needs || []
            };
          }
        }

        if (userType) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            userType,
            profile
          });
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);

    try {
      console.log('Attempting login with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        console.error('Supabase login error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });

        // Handle specific error cases
        if (error.message.includes('Email not confirmed') || error.message.includes('confirm')) {
          toast({
            title: "Email confirmation required",
            description: "Please check your email and click the confirmation link before logging in.",
            variant: "destructive",
          });
          throw error;
        }

        if (error.message.includes('Invalid login credentials')) {
          console.log('Invalid credentials for email:', email);
          console.log('This could mean:');
          console.log('1. User does not exist with this email');
          console.log('2. Password is incorrect');
          console.log('3. Email is not confirmed');
          console.log('4. Account is disabled');
          console.log('5. Wrong Supabase project/environment');

          // Let's check the Supabase configuration
          console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
          console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

          toast({
            title: "Login failed",
            description: "Invalid email or password. Please check your credentials and try again. If you just registered, make sure your email is confirmed.",
            variant: "destructive",
          });
          throw error;
        }

        if (error.message.includes('Too many requests')) {
          toast({
            title: "Too many attempts",
            description: "Too many login attempts. Please wait a few minutes before trying again.",
            variant: "destructive",
          });
          throw error;
        }

        // Generic error
        toast({
          title: "Login failed",
          description: error.message || "An error occurred during login.",
          variant: "destructive",
        });
        throw error;
      }

      if (!data.user) {
        throw new Error('Login failed - no user data returned');
      }

      // Fetch profile from database
      let profile = null;
      let userType: UserType | null = null;

      // Try jobseeker profile
      const { data: jobSeekerData, error: jobSeekerError } = await supabase
        .from('profile')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (jobSeekerData && !jobSeekerError) {
        userType = 'jobseeker';
        // Fetch skills
        const { data: skillsData } = await supabase
          .from('jobseeker_skill_rating')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        profile = {
          id: jobSeekerData.user_id,
          name: `${jobSeekerData.first_name} ${jobSeekerData.surname}`.trim(),
          email: jobSeekerData.email,
          profilePic: jobSeekerData.profile_pic || '',
          cv: jobSeekerData.cv_url || '',
          interests: skillsData?.interests || [],
          skills: {
            soft: skillsData?.soft_skills || 0,
            hard: skillsData?.hard_skills || 0,
            feedback: skillsData?.feedback_score || 0,
            learning: skillsData?.learning_score || 0
          },
          bio: jobSeekerData.bio || ''
        };
      } else {
        // Try organization profile
        const { data: orgData, error: orgError } = await supabase
          .from('organization_details')
          .select('*')
          .eq('organization_id', data.user.id)
          .single();

        if (orgData && !orgError) {
          userType = 'organization';
          profile = {
            id: orgData.organization_id,
            name: orgData.company_name,
            email: orgData.email,
            logo: orgData.logo || '',
            website: orgData.website || '',
            about: orgData.about || '',
            needs: orgData.needs || []
          };
        }
      }

      if (userType) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          userType,
          profile
        };
        setUser(authUser);
        toast({
          title: "Login successful",
          description: `Welcome back to Talendeur!`,
        });
      } else {
        // If no profile found, create one (for users who registered but profile creation failed)
        console.log('No profile found, creating new profile for user:', data.user.id);

        const newUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          userType: 'jobseeker', // Default to jobseeker, they can change later
          profile: null
        };

        // Create profile record
        const { error: insertError } = await supabase.from('profile').insert({
          user_id: data.user.id,
          email: data.user.email || email,
          user_type: 'jobseeker',
          first_name: '',
          surname: '',
          bio: '',
          profile_pic: '',
          cv_url: ''
        });

        if (insertError) {
          console.error('Failed to create profile:', insertError);
          toast({
            title: "Profile creation failed",
            description: "Your account was created but profile setup failed. Please contact support.",
            variant: "destructive",
          });
          // Still allow login but with limited functionality
          setUser(newUser);
          return;
        }

        console.log('Profile created successfully');
        setUser(newUser);
        toast({
          title: "Login successful",
          description: "Welcome to Talendeur! Please complete your profile.",
        });
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
  const register = async (email: string, password: string, userType: UserType) => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Check if user needs email confirmation
        if (!data.session) {
          // User needs to confirm email
          toast({
            title: "Registration initiated",
            description: "Please check your email and click the confirmation link to complete registration.",
          });
          return;
        }

        // User is automatically signed in (no email confirmation required)
        // Insert into appropriate table
        if (userType === 'jobseeker') {
          const { error: insertError } = await supabase.from('profile').insert({
            user_id: data.user.id,
            email: email,
            user_type: 'jobseeker',
            first_name: '',
            surname: '',
            bio: '',
            profile_pic: '',
            cv_url: ''
          });
          if (insertError) throw insertError;
        } else {
          const { error: insertError } = await supabase.from('organization_details').insert({
            organization_id: data.user.id,
            company_name: '',
            email: email,
            logo: '',
            website: '',
            about: '',
            needs: []
          });
          if (insertError) throw insertError;
        }

        // Set user state
        const newUser: AuthUser = {
          id: data.user.id,
          email: email,
          userType,
          profile: null
        };

        setUser(newUser);

        toast({
          title: "Registration successful",
          description: "Your account has been created. Please complete your profile.",
        });
      }
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

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
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

  // Resend confirmation email function
  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        toast({
          title: "Failed to resend",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Confirmation email sent",
        description: "Please check your email for the new confirmation link.",
      });
      return true;
    } catch (error) {
      console.error('Resend confirmation error:', error);
      return false;
    }
  };

  // Reset password function
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
        return false;
      }

      toast({
        title: "Password reset email sent",
        description: "Please check your email for password reset instructions.",
      });
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      return false;
    }
  };

  // Debug function to check user status
  const checkUserStatus = async (email: string) => {
    try {
      console.log('Checking user status for:', email);
      console.log('🔍 Connecting to Supabase project:', import.meta.env.VITE_SUPABASE_URL);

      // Extract project ID from URL
      const urlMatch = import.meta.env.VITE_SUPABASE_URL.match(/https:\/\/([a-zA-Z0-9]+)\.supabase\.co/);
      const projectId = urlMatch ? urlMatch[1] : 'unknown';
      console.log('📋 App is configured for Supabase project ID:', projectId);

      // First, let's try a simple query to test the connection
      const { data: testData, error: testError } = await supabase
        .from('profile')
        .select('count', { count: 'exact', head: true });

      if (testError) {
        console.log('❌ Database connection test failed:', testError.message);
        console.log('💡 This might mean the database tables don\'t exist or RLS policies are blocking access');
      } else {
        console.log('✅ Database connection successful, found', testData, 'profiles');
      }

      // Try to get user metadata (this might not work with anon key)
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.log('Cannot get current user:', error.message);
      } else {
        console.log('Current user:', data.user);
      }

      // Try to sign up with the same email to see if it already exists
      console.log('🔄 Testing signup to check if user exists...');
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: email,
        password: 'dummy_password_for_checking_123!',
      });

      if (signupError) {
        if (signupError.message.includes('already registered') || signupError.message.includes('already been registered')) {
          console.log('✅ User EXISTS with this email in this Supabase project');
          return { exists: true, message: `User exists in project ${projectId}` };
        } else {
          console.log('❌ Signup error:', signupError.message);
          return { exists: false, message: `Signup error: ${signupError.message}` };
        }
      } else {
        console.log('ℹ️  User does NOT exist in this Supabase project, signup would succeed');
        // Clean up the dummy signup - but this will fail with anon key
        if (signupData.user && !signupData.session) {
          console.log('🧹 Attempting to clean up dummy user...');
          // This will likely fail with 403 Forbidden since we don't have admin key
          try {
            await supabase.auth.admin.deleteUser(signupData.user.id);
            console.log('✅ Dummy user cleaned up');
          } catch (cleanupError) {
            console.log('⚠️  Could not clean up dummy user (expected with anon key):', cleanupError.message);
          }
        }
        return { exists: false, message: `User does not exist in project ${projectId}` };
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      return { exists: false, message: `Error: ${error.message}` };
    }
  };
  const createProfile = async (userType: UserType) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a profile",
        variant: "destructive",
      });
      return false;
    }

    try {
      if (userType === 'jobseeker') {
        const { error } = await supabase.from('profile').insert({
          user_id: user.id,
          email: user.email,
          user_type: 'jobseeker',
          first_name: '',
          surname: '',
          bio: '',
          profile_pic: '',
          cv_url: ''
        });

        if (error) {
          console.error('Manual profile creation failed:', error);
          toast({
            title: "Profile creation failed",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }
      } else {
        const { error } = await supabase.from('organization_details').insert({
          organization_id: user.id,
          company_name: '',
          email: user.email,
          logo: '',
          website: '',
          about: '',
          needs: []
        });

        if (error) {
          console.error('Manual organization creation failed:', error);
          toast({
            title: "Organization creation failed",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }
      }

      toast({
        title: "Profile created",
        description: "Your profile has been created successfully",
      });
      return true;
    } catch (error) {
      console.error('Profile creation error:', error);
      return false;
    }
  };

  // Update profile function
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
      if (user.userType === 'jobseeker') {
        const jsData = profileData as Partial<JobSeekerProfile>;
        const updateData: Partial<{
          first_name: string;
          surname: string;
          bio: string;
          profile_pic: string;
          cv_url: string;
        }> = {};
        if (jsData.name) {
          const [first, ...rest] = jsData.name.split(' ');
          updateData.first_name = first;
          updateData.surname = rest.join(' ');
        }
        if (jsData.bio !== undefined) updateData.bio = jsData.bio;
        if (jsData.profilePic !== undefined) updateData.profile_pic = jsData.profilePic;
        if (jsData.cv !== undefined) updateData.cv_url = jsData.cv;

        const { error } = await supabase
          .from('profile')
          .update(updateData)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update skills if provided
        if (jsData.skills) {
          const skillsData = {
            user_id: user.id,
            soft_skills: jsData.skills.soft,
            hard_skills: jsData.skills.hard,
            feedback_score: jsData.skills.feedback,
            learning_score: jsData.skills.learning,
            interests: jsData.interests || []
          };

          const { error: skillsError } = await supabase
            .from('jobseeker_skill_rating')
            .upsert(skillsData);

          if (skillsError) throw skillsError;
        }
      } else {
        const orgData = profileData as Partial<OrganizationProfile>;
        const updateData: Partial<{
          company_name: string;
          logo: string;
          website: string;
          about: string;
          needs: string[];
        }> = {};
        if (orgData.name !== undefined) updateData.company_name = orgData.name;
        if (orgData.logo !== undefined) updateData.logo = orgData.logo;
        if (orgData.website !== undefined) updateData.website = orgData.website;
        if (orgData.about !== undefined) updateData.about = orgData.about;
        if (orgData.needs !== undefined) updateData.needs = orgData.needs;

        const { error } = await supabase
          .from('organization_details')
          .update(updateData)
          .eq('organization_id', user.id);

        if (error) throw error;
      }

      // Update local state
      const updatedUser = {
        ...user,
        profile: {
          ...user.profile,
          ...profileData
        }
      };

      setUser(updatedUser);

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
      updateProfile,
      createProfile,
      resendConfirmation,
      resetPassword,
      checkUserStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => useContext(AuthContext);
