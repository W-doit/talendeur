export type CookieConsentStatus = 'accepted' | 'rejected';

export const COOKIE_CONSENT_KEY = 'talendeur_cookie_consent';
export const OPEN_COOKIE_PREFERENCES_EVENT = 'talendeur:open-cookie-preferences';

export function getCookieConsent(): CookieConsentStatus | null {
  try {
    const value = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (value === 'accepted' || value === 'rejected') return value;
  } catch {
    // ignore storage errors
  }
  return null;
}

export function setCookieConsent(status: CookieConsentStatus): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, status);
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new CustomEvent('talendeur:cookie-consent-changed', { detail: status }));
}

export function openCookiePreferences(): void {
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_PREFERENCES_EVENT));
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent() === 'accepted';
}

/**
 * Load Google Analytics only after explicit consent.
 * Set VITE_GA_MEASUREMENT_ID in .env when ready.
 */
export function loadAnalyticsIfAllowed(): void {
  if (!hasAnalyticsConsent()) return;

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (!measurementId || typeof document === 'undefined') return;
  if (document.getElementById('talendeur-ga-script')) return;

  const script = document.createElement('script');
  script.id = 'talendeur-ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  const inline = document.createElement('script');
  inline.id = 'talendeur-ga-inline';
  inline.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}', { anonymize_ip: true });
  `;
  document.head.appendChild(inline);
}

export function revokeAnalytics(): void {
  const script = document.getElementById('talendeur-ga-script');
  const inline = document.getElementById('talendeur-ga-inline');
  script?.remove();
  inline?.remove();
}
