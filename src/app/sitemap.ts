import type { MetadataRoute } from 'next';
import { SITE_URL, API_BASE } from '@/lib/config';

// Rebuild this route at most once per hour so newly published blogs show up
// in the sitemap without forcing an un-cached fetch on every crawl.
export const revalidate = 3600;

// Fetch published blog posts from the backend. Failures are swallowed so a
// backend hiccup never breaks the sitemap route — static pages still render.
async function getBlogs(): Promise<{ _id: string; updatedAt?: string; publishedAt?: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/blogs/published?limit=100`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const blogs = json?.data;
    return Array.isArray(blogs) ? blogs : [];
  } catch {
    return [];
  }
}

// Fetch active test series (safe fields only — the public endpoint never
// returns question data or the raw landing HTML).
async function getSeries(): Promise<{ slug?: string; _id: string; updatedAt?: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/test-series/public?limit=48&page=1`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const series = json?.data;
    return Array.isArray(series) ? series : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/blogs`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/explore`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/plans`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/test-series`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/leaderboard`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${SITE_URL}/materials`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/practice`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/disclaimer`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacy-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms-and-conditions`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/refund-cancellation`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  // Dynamic blog URLs — every published post gets its own sitemap entry so
  // search engines can discover new content without waiting for a manual update.
  const blogs = await getBlogs();
  const blogRoutes: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${SITE_URL}/blogs/${blog._id}`,
    lastModified: blog.updatedAt || blog.publishedAt || now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Dynamic test-series landing pages (public catalog detail pages).
  const series = await getSeries();
  const seriesRoutes: MetadataRoute.Sitemap = series.map((s) => ({
    url: `${SITE_URL}/explore/${s.slug || s._id}`,
    lastModified: s.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...seriesRoutes, ...blogRoutes];
}