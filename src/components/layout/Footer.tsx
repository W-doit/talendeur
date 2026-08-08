
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
              Connecting talent with opportunities. Revolutionizing the job market with our matchmaking platform.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For Job Seekers</h4>
            <ul className="space-y-2">
              <li><Link to="/register" className="text-sm text-gray-300 hover:text-white">Create Profile</Link></li>
              <li><Link to="/find" className="text-sm text-gray-300 hover:text-white">Find Organizations</Link></li>
              <li><Link to="/matches" className="text-sm text-gray-300 hover:text-white">View Matches</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For Organizations</h4>
            <ul className="space-y-2">
              <li><Link to="/register" className="text-sm text-gray-300 hover:text-white">Create Profile</Link></li>
              <li><Link to="/find" className="text-sm text-gray-300 hover:text-white">Find Talent</Link></li>
              <li><Link to="/matches" className="text-sm text-gray-300 hover:text-white">View Matches</Link></li>
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
              <a href="#" className="text-gray-300 hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/talendeur/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
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
