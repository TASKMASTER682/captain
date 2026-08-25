/*
 * ExamOS service worker.
 *
 * History note: an older build shipped a service worker whose script was later
 * removed, which made browsers loop page reloads. This one is intentionally
 * conservative:
 *
 *   - Online behaviour is unchanged: every request goes to the network first,
 *     except immutable content-hashed static assets.
 *   - The backend API is NEVER intercepted (exam answers/timers must always
 *     hit the live server).
 *   - Pages are only cached as an OFFLINE FALLBACK, never served while online,
 *     so stale-HTML loops are impossible.
 *   - Only successful, non-redirected, same-origin GET responses are cached.
 */

const VERSION = 'v2';
const STATIC_CACHE = `examos-static-${VERSION}`;
const PAGES_CACHE = `examos-pages-${VERSION}`;
const OFFLINE_URL = '/offline';
const NAVIGATION_TIMEOUT_MS = 8000;

// Set via postMessage in dev builds: the worker stays registered (so the app
// remains installable) but intercepts nothing, keeping HMR/Fast Refresh and
// un-hashed dev chunks completely untouched.
let devPassthrough = false;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // Best-effort precache of the offline fallback. Failure must not block
      // installation — the page is re-cached on the next successful visit.
      try {
        const cache = await caches.open(PAGES_CACHE);
        await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
      } catch (_) {
        /* offline page will be cached on first successful navigation */
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('examos-') && name !== STATIC_CACHE && name !== PAGES_CACHE)
          .map((name) => caches.delete(name)
        )
      );
      // Only claim clients in production to avoid reload loops in dev
      if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
        return;
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'DEV_PASSTHROUGH') devPassthrough = true;
});

/** True only for plain, cacheable, same-origin GET responses. */
function isCacheable(response) {
  return (
    response &&
    response.ok &&
    response.type === 'basic' &&
    !response.redirected &&
    response.headers.get('vary') !== '*'
  );
}

function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error('timeout'));
    }, ms);
    fetch(request, { signal: controller.signal }).then(
      (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * Network-first for document navigations. While online the user ALWAYS gets
 * fresh HTML (cached copies are only used when the network fails), which is
 * what keeps resume-after-refresh exam behaviour identical to today's.
 */
async function handleNavigation(request) {
  let networkError = null;
  try {
    const response = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
    if (isCacheable(response)) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    networkError = error;
  }
  // Network unavailable (or hung): fall back to the last good copy, then the
  // dedicated offline page. Never synthesize anything else.
  const cached = (await caches.match(request)) || (await caches.match(OFFLINE_URL));
  if (cached) return cached;
  throw networkError || new Error('offline');
}

self.addEventListener('fetch', (event) => {
  if (devPassthrough) return;

  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Cross-origin (backend API, CDNs, fonts, payment gateways…): hands off.
  if (url.origin !== self.location.origin) return;

  // Same-origin API routes: hands off, always the network.
  if (url.pathname.startsWith('/api/')) return;

  // Document navigations: fresh when online, cached/offline page when not.
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Immutable, content-hashed build assets + generated icons: cache-first.
  // These URLs change whenever their content changes, so staleness is impossible.
  const isImmutableAsset =
    url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/');
  if (isImmutableAsset) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (isCacheable(response)) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone()).catch(() => {});
          }
          return response;
        } catch (error) {
          throw error;
        }
      })()
    );
  }

  // Everything else (public files, fonts, XHRs to this origin…): untouched.
});
