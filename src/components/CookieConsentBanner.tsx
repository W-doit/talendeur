import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  COOKIE_CONSENT_KEY,
  OPEN_COOKIE_PREFERENCES_EVENT,
  getCookieConsent,
  loadAnalyticsIfAllowed,
  revokeAnalytics,
  setCookieConsent,
  type CookieConsentStatus,
} from '@/lib/cookie-consent';

const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = getCookieConsent();
    if (!existing) {
      setVisible(true);
    } else if (existing === 'accepted') {
      loadAnalyticsIfAllowed();
    }

    const onOpenPreferences = () => setVisible(true);
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, onOpenPreferences);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, onOpenPreferences);
  }, []);

  const choose = (status: CookieConsentStatus) => {
    setCookieConsent(status);
    if (status === 'accepted') {
      loadAnalyticsIfAllowed();
    } else {
      revokeAnalytics();
      try {
        localStorage.setItem(COOKIE_CONSENT_KEY, status);
      } catch {
        // ignore
      }
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6"
    >
      <div className="max-w-4xl mx-auto rounded-xl border border-gray-200 bg-white shadow-xl p-5 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">We value your privacy</h2>
        <p className="text-sm text-gray-600 mb-4">
          We use essential cookies to make Talendeur work. Optional analytics cookies help us
          understand usage and improve the product. Non-essential tracking loads only if you accept.
          Read our{' '}
          <Link to="/privacy-policy" className="text-talendeur-primary underline hover:text-talendeur-orange">
            Privacy Policy
          </Link>
          {' '}and{' '}
          <Link to="/cookie-policy" className="text-talendeur-primary underline hover:text-talendeur-orange">
            Cookie Policy
          </Link>
          .
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => choose('rejected')}
          >
            Reject non-essential
          </Button>
          <Button
            type="button"
            className="bg-talendeur-primary hover:bg-talendeur-primary-dark text-white"
            onClick={() => choose('accepted')}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
