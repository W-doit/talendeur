/**
 * First-party product analytics → public.product_events (Supabase).
 * Query examples in SQL editor — see README section or comments at bottom.
 */
import { supabase } from '@/integrations/supabase/client';
import { hasAnalyticsConsent } from '@/lib/cookie-consent';

export type ProductEventName =
  | 'page_view'
  | 'registration'
  | 'profile_ready'
  | 'feature_click'
  | 'share';

const SESSION_KEY = 'talendeur_analytics_session';

function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}

/**
 * Insert a product event. Failures are swallowed so UX never breaks.
 *
 * page_view requires cookie analytics consent.
 * Other events are first-party product telemetry (logged-in or anonymous).
 */
export async function trackEvent(
  eventName: ProductEventName,
  properties: Record<string, unknown> = {},
  options?: { path?: string; requireConsent?: boolean }
): Promise<void> {
  const requireConsent = options?.requireConsent ?? eventName === 'page_view';
  if (requireConsent && !hasAnalyticsConsent()) return;

  try {
    const path = options?.path ?? (typeof window !== 'undefined' ? window.location.pathname : null);
    // Table added via migration; cast until types are regenerated
    const { error } = await (supabase as any).from('product_events').insert({
      event_name: eventName,
      path,
      session_id: getSessionId(),
      properties,
    });
    if (error) {
      console.warn('product_events insert failed:', error.message);
    }
  } catch (err) {
    console.warn('product_events insert error:', err);
  }
}

export function trackFeatureClick(feature: string, extra: Record<string, unknown> = {}) {
  return trackEvent('feature_click', { feature, ...extra });
}

export function trackShare(channel: string, extra: Record<string, unknown> = {}) {
  return trackEvent('share', { channel, ...extra });
}

/*
Example SQL (Supabase → SQL Editor):

-- Page visits (last 7 days)
SELECT date_trunc('day', created_at) AS day, count(*) AS views
FROM product_events
WHERE event_name = 'page_view' AND created_at > now() - interval '7 days'
GROUP BY 1 ORDER BY 1;

-- Registrations
SELECT count(*) FROM product_events WHERE event_name = 'registration';
-- Or from Auth: select count(*) from auth.users;

-- Profile ready
SELECT count(DISTINCT user_id) FROM product_events WHERE event_name = 'profile_ready';

-- Feature clicks
SELECT properties->>'feature' AS feature, count(*)
FROM product_events WHERE event_name = 'feature_click'
GROUP BY 1 ORDER BY 2 DESC;

-- Shares
SELECT properties->>'channel' AS channel, count(*)
FROM product_events WHERE event_name = 'share'
GROUP BY 1 ORDER BY 2 DESC;
*/
