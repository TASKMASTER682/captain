// Central frontend configuration.
// Everything reads from env vars; localhost is ONLY used as a dev fallback.
// In production a missing/localhost URL is surfaced loudly instead of silently
// hammering localhost.

const isProduction = process.env.NODE_ENV === 'production';

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

const looksLikeLocalhost = (url: string) =>
  /(^|:\/\/)localhost([/:]|$)|127\.0\.0\.1/.test(url);

const resolveApiBase = () => {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv) return stripTrailingSlash(fromEnv);
  if (isProduction) {
    console.error(
      '[config] NEXT_PUBLIC_API_URL is missing in production. Set it at build time to your deployed backend, e.g. https://api.examos.com/api'
    );
    return '';
  }
  return 'http://localhost:5000/api';
};

const resolveSiteUrl = () => {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return stripTrailingSlash(fromEnv);
  if (isProduction) {
    console.error(
      '[config] NEXT_PUBLIC_SITE_URL is missing in production. Set it at build time to your deployed frontend, e.g. https://examos.com'
    );
    return '';
  }
  return 'http://localhost:3000';
};

export const API_BASE = resolveApiBase();
export const SITE_URL = resolveSiteUrl();

// Loud safety net for production builds that leaked a localhost URL in.
if (isProduction && looksLikeLocalhost(API_BASE)) {
  console.error(
    '[config] NEXT_PUBLIC_API_URL points to localhost in production. Rebuild with your deployed backend URL, e.g. https://api.examos.com/api'
  );
}