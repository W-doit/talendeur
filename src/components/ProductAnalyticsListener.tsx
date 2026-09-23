import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '@/lib/product-analytics';

/**
 * Logs page_view on each SPA route change (only when analytics consent is given).
 */
const ProductAnalyticsListener: React.FC = () => {
  const location = useLocation();
  const lastPath = useRef<string>('');

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    if (path === lastPath.current) return;
    lastPath.current = path;
    void trackEvent('page_view', { search: location.search || null }, { path: location.pathname });
  }, [location.pathname, location.search]);

  return null;
};

export default ProductAnalyticsListener;
