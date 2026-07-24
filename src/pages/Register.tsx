
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, UserType } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainLayout from '@/components/layout/MainLayout';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { getPasswordValidation } from '@/lib/password-validation';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('jobseeker');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const validatePassword = () => {
    const { isValid } = getPasswordValidation(password);
    if (!isValid) {
      setPasswordError('Password does not meet all security requirements');
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      console.log('Starting registration...');
      await register(email, password, userType);
      console.log('Registration successful, navigating to profile...');
      // Small delay to ensure profile is loaded
      setTimeout(() => {
        navigate('/profile');
      }, 500);
    } catch (error) {
      // Error is handled in the auth context
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-16 px-4">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create an account</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <Tabs 
                defaultValue="jobseeker" 
                className="w-full"
                onValueChange={(value) => setUserType(value as UserType)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="jobseeker">Individual</TabsTrigger>
                  <TabsTrigger value="organization">Organisation</TabsTrigger>
                </TabsList>
                <TabsContent value="jobseeker" className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your individual profile to showcase your skills and connect with organisations
                  </p>
                </TabsContent>
                <TabsContent value="organization" className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your organisation profile to find the perfect talent for your team
                  </p>
                </TabsContent>
              </Tabs>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input
                  id="password"
                  placeholder="Create a strong password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <PasswordStrengthIndicator password={password} />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                <Input
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-talendeur-primary hover:bg-talendeur-primary-dark text-white"
                disabled={isSubmitting || !getPasswordValidation(password).isValid}
              >
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-talendeur-orange hover:underline">
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Register;
