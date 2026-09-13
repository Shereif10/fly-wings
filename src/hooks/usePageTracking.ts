import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) return 'mobile';
  return 'desktop';
};

const getVisitorId = (): string => {
  let id = localStorage.getItem('fw_visitor_id');
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('fw_visitor_id', id);
  }
  return id;
};

const getReferrerSource = (): string => {
  const ref = document.referrer;
  if (!ref) return 'Direct';
  try {
    const url = new URL(ref);
    return url.hostname;
  } catch {
    return 'Direct';
  }
};

const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Don't track admin pages
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/auth')) return;

    const trackView = async () => {
      try {
        // Analytics modules are loaded lazily so they never block the main thread
        const [{ collection, addDoc }, { db }] = await Promise.all([
          import('firebase/firestore'),
          import('@/lib/firebase'),
        ]);
        const now = new Date();
        await addDoc(collection(db, 'page_views'), {
          page: location.pathname,
          visitorId: getVisitorId(),
          device: getDeviceType(),
          source: getReferrerSource(),
          timestamp: now.toISOString(),
          date: now.toISOString().split('T')[0],
          language: navigator.language,
        });
      } catch (error) {
        // Silently fail - don't break the app for analytics
        console.debug('Analytics tracking error:', error);
      }
    };

    // Wait for the page to settle, then run during idle time
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    const schedule = () => {
      const ric = (window as any).requestIdleCallback as
        | ((cb: () => void, opts?: { timeout: number }) => number)
        | undefined;
      if (ric) idleId = ric(() => trackView(), { timeout: 4000 });
      else timeoutId = window.setTimeout(trackView, 2000);
    };

    if (document.readyState === 'complete') {
      timeoutId = window.setTimeout(schedule, 1200);
    } else {
      window.addEventListener('load', schedule, { once: true });
    }

    return () => {
      window.removeEventListener('load', schedule);
      if (timeoutId) window.clearTimeout(timeoutId);
      if (idleId && (window as any).cancelIdleCallback) (window as any).cancelIdleCallback(idleId);
    };
  }, [location.pathname]);
};

export default usePageTracking;
