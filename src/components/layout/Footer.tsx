
import React from 'react';
import { Link } from 'react-router-dom';
import FeedbackButton from '@/components/FeedbackButton';
import { openCookiePreferences } from '@/lib/cookie-consent';

const Footer: React.FC = () => {
  return (
    <footer className="bg-talendeur-dark text-white py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Talendeur</h3>
            <p className="text-sm text-gray-300">
              Connecting talent with opportunities. Revolutionising the job market with our matchmaking platform.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For job seekers</h4>
            <ul className="space-y-2">
              <li><Link to="/register" className="text-sm text-gray-300 hover:text-white">Create profile</Link></li>

              <li><Link to="/matches" className="text-sm text-gray-300 hover:text-white">View matches</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For organisations</h4>
            <ul className="space-y-2">
              <li><Link to="/register" className="text-sm text-gray-300 hover:text-white">Create profile</Link></li>

              <li><Link to="/matches" className="text-sm text-gray-300 hover:text-white">View matches</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><FeedbackButton inFooter={true} /></li>
              <li><a href="mailto:info@talendeur.com" className="text-sm text-gray-300 hover:text-white">info@talendeur.com</a></li>
              <li className="text-sm text-gray-300">8 Saffron House, 43 Camborne Road, Sutton, SM2 6RF. United Kingdom</li>
            </ul>
            <div className="mt-4 flex space-x-4">
              <a
                href="https://www.linkedin.com/company/talendeur/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white"
              >
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/talendeur/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white"
              >
                <span className="sr-only">Instagram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@talendeur"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white"
              >
                <span className="sr-only">TikTok</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 0010.86 4.48V13a8.28 8.28 0 004.84 1.55V11.1a4.85 4.85 0 01-.26-.03z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} Talendeur. All rights reserved.</p>
          <p className="text-sm mt-2 space-x-4">
            <a href="/privacy-policy" className="text-talendeur-primary underline hover:text-talendeur-orange transition-colors">Privacy Policy</a>
            <a href="/cookie-policy" className="text-talendeur-primary underline hover:text-talendeur-orange transition-colors">Cookie Policy</a>
            <a href="/imprint" className="text-talendeur-primary underline hover:text-talendeur-orange transition-colors">Imprint</a>
            <button
              type="button"
              onClick={openCookiePreferences}
              className="text-talendeur-primary underline hover:text-talendeur-orange transition-colors"
            >
              Cookie preferences
            </button>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
