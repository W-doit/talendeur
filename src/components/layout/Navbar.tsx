
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Building } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-white via-talendeur-orange to-talendeur-primary px-6 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/Talendeur_logo.png" 
              alt="Talendeur" 
              className="h-20 w-auto object-contain"
            />
          </Link>
          {/* Address removed as requested */}
          {/* LinkedIn icon removed as requested */}
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/profile">
                <Button variant="outline" className="bg-white/70 text-talendeur-primary hover:bg-white/90 text-base">
                  {user.userType === 'jobseeker' ? (
                    <User className="mr-2 h-5 w-5" />
                  ) : (
                    <Building className="mr-2 h-5 w-5" />
                  )}
                  Profile
                </Button>
              </Link>
              <Link to="/matches">
                <Button variant="outline" className="bg-white/70 text-talendeur-primary hover:bg-white/90 text-base">
                  Matches
                </Button>
              </Link>
              <Link to="/find">
                <Button variant="outline" className="bg-white/70 text-talendeur-primary hover:bg-white/90 text-base">
                  Find {user.userType === 'jobseeker' ? 'Organizations' : 'Talent'}
                </Button>
              </Link>
              <Button 
                variant="outline"
                className="bg-white/70 text-talendeur-primary hover:bg-white/90"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" className="bg-white/70 text-talendeur-primary hover:bg-white/90">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="bg-white/70 text-talendeur-primary hover:bg-white/90">
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
