import { API_BASE } from './api';

// Lightweight in-app analytics — replaces a third-party tag. Fires fire-and-forget
// requests AFTER the page paints, so it never slows the UI. All failures are
// swallowed (tracking must never break the app).

function sessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('exam_analytics_session');
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('exam_analytics_session', id);
  }
  return id;
}

function token(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

function fire(payload: Record<string, unknown>) {
  try {
    if (typeof window === 'undefined') return;
    const body = JSON.stringify({ ...payload, sessionId: sessionId() });
    const endpoint = `${API_BASE}/analytics/track`;

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never break the app because of analytics
  }
}

/** Called on every route change. Pings the live-session map + stores a pageview. */
export function trackPageview(path: string, page?: string) {
  fire({
    event: false,
    path,
    page: page || '',
    referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
  });
}

/** Custom event (e.g. signup, test_started). Pings live, no DB row yet. */
export function trackEvent(name: string, meta?: Record<string, unknown>) {
  fire({
    event: true,
    name,
    path: typeof window !== 'undefined' ? window.location.pathname : '',
    page: '',
    referrer: '',
    ...(meta ? { meta } : {}),
  });
}

/** ~30s heartbeat so the backend can count "online right now". */
export function heartbeat() {
  fire({
    event: true,
    name: '__heartbeat',
    path: typeof window !== 'undefined' ? window.location.pathname : '',
  });
}