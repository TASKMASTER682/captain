import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogDetailClient from './BlogDetailClient';

type Props = { params: Promise<{ id: string }> };

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

async function getBlog(id: string) {
  try {
    const res = await fetch(`${API_BASE}/blogs/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const blog = await getBlog(id);
  if (!blog) return { title: 'Blog not found' };

  return {
    title: blog.title,
    description: blog.excerpt || undefined,
    openGraph: {
      title: blog.title,
      description: blog.excerpt || undefined,
      type: 'article',
      publishedTime: blog.publishedAt || undefined,
      images: blog.coverImage ? [{ url: blog.coverImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.excerpt || undefined,
    },
    alternates: { canonical: `/blogs/${id}` },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { id } = await params;
  const blog = await getBlog(id);
  if (!blog) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.excerpt || undefined,
    image: blog.coverImage || undefined,
    datePublished: blog.publishedAt || undefined,
    dateModified: blog.updatedAt || undefined,
    author: blog.author?.name ? { '@type': 'Person', name: blog.author.name } : undefined,
    keywords: Array.isArray(blog.tags) ? blog.tags.join(', ') : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <BlogDetailClient blog={blog} />
    </>
  );
}