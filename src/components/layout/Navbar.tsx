
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Building } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-talendeur-red to-talendeur-orange px-6 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-white">Talendeur</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/profile">
                <Button variant="ghost" className="text-white hover:bg-white/20">
                  {user.userType === 'jobseeker' ? (
                    <User className="mr-2 h-5 w-5" />
                  ) : (
                    <Building className="mr-2 h-5 w-5" />
                  )}
                  Profile
                </Button>
              </Link>
              <Link to="/matches">
                <Button variant="ghost" className="text-white hover:bg-white/20">
                  Matches
                </Button>
              </Link>
              <Link to="/find">
                <Button variant="outline" className="bg-white text-talendeur-red hover:bg-white/90">
                  Find {user.userType === 'jobseeker' ? 'Organizations' : 'Talent'}
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={() => logout()}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-white hover:bg-white/20">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="bg-white text-talendeur-red hover:bg-white/90">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
