
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, UserType } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainLayout from '@/components/layout/MainLayout';

const Register: React.FC = () => {
  // Adding states for the mandatory fields to submit to backend
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('jobseeker');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const validatePassword = () => {
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
      await register(email, password, userType);
      navigate('/profile');
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
            <CardDescription className="text-center">
              Join Talendeur and connect with your perfect match
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <Tabs 
                defaultValue="jobseeker" 
                className="w-full"
                onValueChange={(value) => setUserType(value as UserType)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="jobseeker">Job Seeker</TabsTrigger>
                  <TabsTrigger value="organization">Organization</TabsTrigger>
                </TabsList>
                <TabsContent value="jobseeker" className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your job seeker profile to showcase your skills and connect with organizations
                  </p>
                  {/* JOBSEEKER SPECIFIC FIELDS */}
                   <div className="space-y-2">
        <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
        <Input
          id="firstName"
          placeholder="Your first name"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required={userType === 'jobseeker'}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="surname" className="text-sm font-medium">Surname</label>
        <Input
          id="surname"
          placeholder="Your surname"
          type="text"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
          required={userType === 'jobseeker'}
        />
      </div>
                </TabsContent>
                <TabsContent value="organization" className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your organization profile to find the perfect talent for your team
                  </p>
                  {/* ORGANISATION SPECIFIC DETAILS */}
                  <div className="space-y-2">
        <label htmlFor="companyName" className="text-sm font-medium">Company Name</label>
        <Input
          id="companyName"
          placeholder="Your company name"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required={userType === 'organization'}
        />
      </div>
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
                  placeholder="Create a password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                <Input
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-talendeur-red hover:bg-talendeur-darkred"
                disabled={isSubmitting}
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
