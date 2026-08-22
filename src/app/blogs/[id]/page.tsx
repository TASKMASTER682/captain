import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogDetailClient from './BlogDetailClient';
import { API_BASE, SITE_URL } from '@/lib/config';

type Props = { params: Promise<{ id: string }> };

async function getBlog(id: string) {
  try {
    const res = await fetch(`${API_BASE}/blogs/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch (_e) {
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
    keywords: Array.isArray(blog.tags) ? blog.tags : undefined,
    openGraph: {
      title: blog.title,
      description: blog.excerpt || undefined,
      type: 'article',
      url: `${SITE_URL}/blogs/${id}`,
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

function buildBlogJsonLd(blog: {
  title: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt?: string;
  updatedAt?: string;
  author?: { name?: string } | null;
  tags?: string[];
  subject?: string;
  seoSchema?: string;
  seoConfig?: Record<string, unknown>;
}, id: string) {
  const baseUrl = `${SITE_URL}/blogs/${encodeURIComponent(id)}`;
  const author = blog.author?.name
    ? { '@type': 'Person', name: blog.author.name }
    : { '@type': 'Organization', name: 'ExamOS' };
  const publisher = { '@type': 'Organization', name: 'ExamOS', url: SITE_URL };
  const image = blog.coverImage || undefined;
  const keywords = Array.isArray(blog.tags) ? blog.tags.join(', ') : undefined;

  const schemaType = blog.seoSchema || 'BlogPosting';
  const cfg = blog.seoConfig && typeof blog.seoConfig === 'object' ? blog.seoConfig : {};

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blogs & Articles', item: `${SITE_URL}/blogs` },
        { '@type': 'ListItem', position: 3, name: blog.title },
      ],
    },
  ];

  const common = {
    headline: blog.title,
    description: blog.excerpt || undefined,
    image,
    datePublished: blog.publishedAt || undefined,
    dateModified: blog.updatedAt || undefined,
    author,
    publisher,
    keywords,
    mainEntityOfPage: baseUrl,
  };

  switch (schemaType) {
    case 'Article':
      graph.push({ '@type': 'Article', ...common, articleSection: blog.subject || undefined });
      break;
    case 'FAQPage': {
      const faq = Array.isArray(cfg.faq) ? cfg.faq : [];
      graph.push({
        '@type': 'FAQPage',
        ...common,
        mainEntity: faq
          .filter((q: { question?: string; answer?: string }) => q.question && q.answer)
          .map((q: { question?: string; answer?: string }) => ({
            '@type': 'Question',
            name: q.question,
            acceptedAnswer: { '@type': 'Answer', text: q.answer },
          })),
      });
      break;
    }
    case 'HowTo': {
      const steps = Array.isArray(cfg.steps) ? cfg.steps : [];
      graph.push({
        '@type': 'HowTo',
        ...common,
        name: cfg.name || blog.title,
        totalTime: cfg.totalTime || undefined,
        step: steps
          .filter((s: { name?: string; text?: string }) => s.name || s.text)
          .map((s: { name?: string; text?: string }, idx: number) => ({
            '@type': 'HowToStep',
            position: idx + 1,
            name: s.name,
            text: s.text,
          })),
      });
      break;
    }
    case 'Course':
      graph.push({
        '@type': 'Course',
        ...common,
        name: cfg.courseName || blog.title,
        provider: { '@type': 'Organization', name: cfg.providerName || 'ExamOS' },
        description: cfg.description || blog.excerpt || undefined,
      });
      break;
    case 'Quiz': {
      const questions = Array.isArray(cfg.questions) ? cfg.questions : [];
      graph.push({
        '@type': 'Quiz',
        ...common,
        name: cfg.quizName || blog.title,
        about: questions
          .filter((q: { text?: string }) => q.text)
          .map((q: { text?: string; answer?: string }) => ({
            '@type': 'Question',
            name: q.text,
            acceptedAnswer: { '@type': 'Answer', text: q.answer || '' },
          })),
      });
      break;
    }
    case 'BlogPosting':
    default:
      graph.push({ '@type': 'BlogPosting', ...common });
      break;
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export default async function BlogDetailPage({ params }: Props) {
  const { id } = await params;
  const blog = await getBlog(id);
  if (!blog) notFound();

  const jsonLd = buildBlogJsonLd(blog, id);

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
