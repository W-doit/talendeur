import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Building, Menu, X, Briefcase } from 'lucide-react';
import PwaInstallButton from '@/components/PwaInstallButton';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  const navBtnClass =
    'bg-white/70 text-talendeur-primary hover:bg-talendeur-primary hover:text-white text-base transition-colors w-full sm:w-auto justify-start sm:justify-center';

  const AuthLinks = (
    <>
      {user ? (
        <>
          <Button
            variant="outline"
            className={navBtnClass}
            onClick={() => {
              setMenuOpen(false);
              navigate('/profile', { state: { mode: 'view' } });
            }}
          >
            {user.userType === 'jobseeker' ? (
              <User className="mr-2 h-5 w-5" />
            ) : (
              <Building className="mr-2 h-5 w-5" />
            )}
            Profile
          </Button>
          <Link to="/matches" onClick={() => setMenuOpen(false)} className="w-full sm:w-auto">
            <Button variant="outline" className={navBtnClass}>
              <Briefcase className="mr-2 h-5 w-5" />
              Matches
            </Button>
          </Link>

          <Button variant="outline" className={navBtnClass} onClick={handleLogout}>
            <LogOut className="h-5 w-5 sm:mr-0 mr-2" />
            <span className="sm:hidden">Log out</span>
          </Button>
        </>
      ) : (
        <>
          <Link to="/login" onClick={() => setMenuOpen(false)} className="w-full sm:w-auto">
            <Button variant="outline" className={navBtnClass}>
              Login
            </Button>
          </Link>
          <Link to="/register" onClick={() => setMenuOpen(false)} className="w-full sm:w-auto">
            <Button variant="outline" className={navBtnClass}>
              Register
            </Button>
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-gradient-to-r from-white via-talendeur-orange to-talendeur-primary px-4 sm:px-6 py-3 sm:py-4 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
        <Link to="/" className="flex items-center space-x-2 shrink-0" onClick={() => setMenuOpen(false)}>
          <img
            src="/Talendeur_logo.png"
            alt="Talendeur"
            className="h-12 sm:h-20 w-auto object-contain"
          />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
          <PwaInstallButton />
          {AuthLinks}
        </div>

        {/* Mobile toggle */}
        <div className="flex md:hidden items-center gap-2">
          <PwaInstallButton compact size="icon" className="h-10 w-10" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 bg-white/70 text-talendeur-primary border-talendeur-primary"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden mt-3 pb-2 border-t border-white/40 pt-3 flex flex-col gap-2 max-w-7xl mx-auto">
          {AuthLinks}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
