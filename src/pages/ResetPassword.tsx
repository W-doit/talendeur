import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [recoveryTokens, setRecoveryTokens] = useState<{accessToken: string, refreshToken: string} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Safety timeout - always stop validating after 10 seconds
    const timeoutId = setTimeout(() => {
      console.log('Validation timeout reached');
      if (mounted) {
        setIsValidating(false);
        setError('Request timed out. The reset link may have expired. Please request a new one.');
      }
    }, 10000);

    // Handle the password recovery token from the URL hash
    const handlePasswordRecovery = async () => {
      console.log('Starting password recovery flow...');
      console.log('Current URL:', window.location.href);
      console.log('Hash:', window.location.hash);
      
      try {
        // Check if there's a hash with access_token (password recovery link)
        const hashString = window.location.hash.substring(1);
        console.log('Hash string to parse:', hashString);
        
        const hashParams = new URLSearchParams(hashString);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('Parsed hash params:', { 
          hasAccessToken: !!accessToken, 
          accessTokenLength: accessToken?.length,
          hasRefreshToken: !!refreshToken,
          refreshTokenLength: refreshToken?.length,
          type 
        });

        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('Recovery token found');
          console.log('Valid recovery link detected - storing tokens');
          
          // Store the tokens so we can use them when updating the password
          if (mounted) {
            setRecoveryTokens({ accessToken, refreshToken });
            console.log('Tokens stored, password reset form ready');
          }
        } else if (type === 'recovery' && accessToken) {
          console.log('Recovery token found but no refresh token');
          if (mounted) {
            setRecoveryTokens({ accessToken, refreshToken: '' });
            console.log('Password reset form ready (no refresh token)');
          }

          if (mounted) {
            // Clear the hash from URL for security but keep tokens available
            // Don't call replaceState yet, keep the hash so updateUser can use it
            console.log('Password reset form ready');
          }
        } else if (type === 'recovery' && accessToken) {
          console.log('Recovery token found but no refresh token');
          if (mounted) {
            console.log('Password reset form ready (no refresh token)');
          }
        } else {
          console.log('No recovery token in URL, checking existing session...');
          // No recovery token in URL, check if we already have a session
          const { data: { session } } = await supabase.auth.getSession();
          console.log('Existing session check:', !!session);
          
          if (mounted && !session) {
            setError('Invalid or expired reset link. Please request a new password reset.');
          }
        }
      } catch (err) {
        console.error('Error handling password recovery:', err);
        if (mounted) {
          setError('An error occurred. Please try requesting a new password reset.');
        }
      } finally {
        console.log('Finishing validation, mounted:', mounted);
        if (mounted) {
          clearTimeout(timeoutId);
          setIsValidating(false);
        }
      }
    };

    handlePasswordRecovery();

    // Cleanup function
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Attempting to update password...');
      console.log('Has recovery tokens:', !!recoveryTokens);
      
      if (!recoveryTokens) {
        setError('No recovery tokens found. Please request a new reset link.');
        setIsSubmitting(false);
        return;
      }
      
      // Use Supabase REST API directly to avoid hanging issues
      console.log('Using direct API call to update password...');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${recoveryTokens.accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ password: password }),
      });

      const data = await response.json();
      console.log('Direct API response:', { status: response.status, data });

      if (!response.ok) {
        console.error('Update error:', data);
        
        // Handle specific error codes
        if (data.error_code === 'same_password') {
          setError('New password must be different from your current password. Please choose a different password.');
        } else {
          setError(data.error_description || data.msg || data.message || 'Failed to update password');
        }
        setIsSubmitting(false);
      } else {
        console.log('Password updated successfully via API');
        setSuccess(true);
        
        // Sign out any existing sessions
        await supabase.auth.signOut().catch(err => console.warn('Signout error:', err));
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('Caught error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <MainLayout>
        <div className="container max-w-md mx-auto py-16 px-4">
          <Card className="w-full">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Password Reset Successful</CardTitle>
              <CardDescription>
                Your password has been successfully updated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  You can now log in with your new password. Redirecting to login page...
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-white via-talendeur-orange to-talendeur-primary hover:opacity-90"
              >
                Go to Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (isValidating) {
    return (
      <MainLayout>
        <div className="container max-w-md mx-auto py-16 px-4">
          <Card className="w-full">
            <CardContent className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-talendeur-primary" />
              <p className="text-lg">Validating reset link...</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-16 px-4">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Reset Your Password</CardTitle>
            <CardDescription className="text-center">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">New Password</label>
                <div className="relative">
                  <Input
                    id="password"
                    placeholder="Enter new password (min 6 characters)"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    placeholder="Confirm your new password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Password requirements:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>At least 6 characters long</li>
                  <li>Should contain letters and numbers</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-white via-talendeur-orange to-talendeur-primary hover:opacity-90"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating Password...' : 'Reset Password'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ResetPassword;
