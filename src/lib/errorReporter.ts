import { API_BASE, getAuthUser } from './api';

// Sends error reports to the backend error-log API. Failures are swallowed so
// reporting can never break the app (this is exactly the code you don't want
// to add more errors to).
const THROTTLE_MS = 10_000;
const lastSent = new Map<string, number>();

function send(payload: Record<string, unknown>) {
  try {
    if (typeof window === 'undefined') return;

    const key = `${String(payload.type)}|${String(payload.message).slice(0, 200)}`;
    const now = Date.now();
    const last = lastSent.get(key);
    if (last && now - last < THROTTLE_MS) return;
    lastSent.set(key, now);

    const user = getAuthUser();
    const body = JSON.stringify({ ...payload, userId: user?._id || null });
    const endpoint = `${API_BASE}/errors`;

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Never break the app because of error reporting.
  }
}

let inited = false;

/** Wire up global window error / unhandled-rejection capture. Call once per page load. */
export function initErrorReporter() {
  if (typeof window === 'undefined' || inited) return;
  inited = true;

  window.addEventListener('error', (event) => {
    send({
      source: 'client',
      type: 'Uncaught Error',
      message: event.message || 'Unknown client error',
      stack: event.error?.stack || '',
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    send({
      source: 'client',
      type: 'Unhandled Promise Rejection',
      message: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack || '' : '',
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  });
}

/** Explicit reporting from catch blocks / boundaries. */
export function reportError(error: unknown, meta?: Record<string, unknown>) {
  send({
    source: 'client',
    type: 'Captured Error',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack || '' : '',
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    ...(meta ? { meta } : {}),
  });
}