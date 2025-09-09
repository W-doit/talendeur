
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/components/layout/MainLayout';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, resetPassword, checkUserStatus } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/profile');
    } catch (error) {
      // Error is handled in the auth context
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert('Please enter your email address first');
      return;
    }

    try {
      await resetPassword(email);
    } catch (error) {
      console.error('Password reset error:', error);
    }
  };

  const handleCheckUserStatus = async () => {
    if (!email) {
      alert('Please enter your email address first');
      return;
    }

    try {
      const result = await checkUserStatus(email);
      console.log('User status check result:', result);
      alert(`User status: ${result.message}`);
    } catch (error) {
      console.error('User status check error:', error);
      alert('Error checking user status');
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-16 px-4">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Login to Talendeur</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to sign in
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  placeholder="Use alex@example.com or hr@techvision.com"
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
                  placeholder="Use any password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-talendeur-red hover:bg-talendeur-darkred"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-talendeur-orange hover:underline mr-2"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={handleCheckUserStatus}
                  className="text-blue-500 hover:underline ml-2"
                >
                  Check user status
                </button>
              </div>
              <div className="text-sm text-center text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-talendeur-orange hover:underline">
                  Register
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Login;
