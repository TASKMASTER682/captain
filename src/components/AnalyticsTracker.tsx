'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageview, heartbeat } from '@/lib/analytics';

/** Mounted once in the root layout: tracks pageviews on route change + heartbeats. */
export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackPageview(pathname);
  }, [pathname]);

  useEffect(() => {
    const iv = setInterval(heartbeat, 30_000);
    return () => clearInterval(iv);
  }, []);

  return null;
}