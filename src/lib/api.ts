// API client for ExamOS — always talks to the real backend.
// Set NEXT_PUBLIC_API_URL at build time (e.g. https://api.examos.com/api) in
// production; leaving it unset falls back to localhost for local development.
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
export { API_BASE };

// Safety net: in production a missing/localhost API URL is almost always a
// misconfigured build. Surface it loudly instead of silently hammering localhost.
if (process.env.NODE_ENV === 'production' && /(^|:\/\/)localhost([/:]|$)|127\.0\.0\.1/.test(API_BASE)) {
  console.error(
    '[api] NEXT_PUBLIC_API_URL is missing or points to localhost in production. ' +
    'Set NEXT_PUBLIC_API_URL at build time to your deployed backend, e.g. https://api.examos.com/api'
  );
}

// Simple JWT state storage in localStorage
let cachedToken = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
let currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;

export const setAuthToken = (token: string, user: any) => {
  cachedToken = token;
  currentUser = user;
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const clearAuth = () => {
  cachedToken = '';
  currentUser = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const getAuthUser = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        currentUser = JSON.parse(stored);
        return currentUser;
      } catch {
        // Corrupt stored user — discard and treat as logged out.
        clearAuth();
        return null;
      }
    }
  }
  return currentUser;
};

const redirectToLogin = () => {
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
};

const isAuthEndpoint = (endpoint: string) =>
  endpoint.startsWith('/auth/login') ||
  endpoint.startsWith('/auth/register') ||
  endpoint.startsWith('/auth/otp');

async function request(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (cachedToken) {
    headers.set('Authorization', `Bearer ${cachedToken}`);
  }
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, { ...options, headers });

  // Session expired / invalid token — drop the stale session and bounce to login.
  if (res.status === 401 && !isAuthEndpoint(endpoint) && cachedToken) {
    clearAuth();
    redirectToLogin();
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const error: any = new Error(errData.message || `API request failed (${res.status}).`);
    error.status = res.status;
    throw error;
  }
  return await res.json();
}

// Securely download a study material as a logged-in user.
// Uses the Authorization header instead of exposing the JWT in the URL.
export const downloadMaterial = async (id: string, title?: string) => {
  const res = await fetch(`${API_BASE}/materials/${id}/download`, {
    headers: cachedToken ? { Authorization: `Bearer ${cachedToken}` } : {},
  });
  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? 'Please log in to download study materials.'
        : 'Download failed. Please try again.'
    );
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = title || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// Export wrapper helpers
export const api = {
  get: (endpoint: string) => request(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: any) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint: string, body: any) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),

  upload: (endpoint: string, formData: FormData) => request(endpoint, {
    method: 'POST',
    body: formData,
  }),
};