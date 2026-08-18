// API client for ExamOS — always talks to the real backend.
// API_BASE comes from the central config (env-driven; localhost only in dev).
import { API_BASE } from './config';
export { API_BASE };

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
  endpoint.startsWith('/auth/otp') ||
  endpoint.startsWith('/auth/refresh');

interface Subscriber {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}

let isRefreshing = false;
let refreshSubscribers: Subscriber[] = [];

const subscribeTokenRefresh = (resolve: (token: string) => void, reject: (err: any) => void) => {
  refreshSubscribers.push({ resolve, reject });
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((sub) => sub.resolve(token));
  refreshSubscribers = [];
};

const onRefreshFailed = (err: any) => {
  refreshSubscribers.forEach((sub) => sub.reject(err));
  refreshSubscribers = [];
};

async function request(endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers);
  if (cachedToken) {
    headers.set('Authorization', `Bearer ${cachedToken}`);
  }
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  options.credentials = 'include';

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, { ...options, headers });

  // Session expired / invalid token — try refreshing
  if (res.status === 401 && !isAuthEndpoint(endpoint) && cachedToken) {
    const retryRequest = new Promise((resolve, reject) => {
      subscribeTokenRefresh(
        (newToken) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          fetch(url, { ...options, headers })
            .then((retryRes) => {
              if (!retryRes.ok) {
                retryRes.json().then((errData) => {
                  const error: any = new Error(errData.message || `API request failed (${retryRes.status}).`);
                  error.status = retryRes.status;
                  reject(error);
                }).catch(() => {
                  const error: any = new Error(`API request failed (${retryRes.status}).`);
                  error.status = retryRes.status;
                  reject(error);
                });
              } else {
                resolve(retryRes.json());
              }
            })
            .catch(reject);
        },
        (err) => {
          reject(err);
        }
      );
    });

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData.data.token;
          const user = refreshData.data.user;
          setAuthToken(newToken, user);
          isRefreshing = false;
          onRefreshed(newToken);
        } else {
          isRefreshing = false;
          clearAuth();
          redirectToLogin();
          const error: any = new Error('Session expired.');
          error.status = 401;
          onRefreshFailed(error);
        }
      } catch (refreshErr) {
        isRefreshing = false;
        clearAuth();
        redirectToLogin();
        onRefreshFailed(refreshErr);
      }
    }

    return retryRequest;
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
    credentials: 'include',
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