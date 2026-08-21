import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SeriesDetailClient from './SeriesDetailClient';
import { API_BASE, SITE_URL } from '@/lib/config';

type Props = { params: Promise<{ slug: string }> };

const stripTags = (html = '') => String(html)
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/\s+/g, ' ')
  .trim();

// Fallback meta description: first substantial paragraph of the admin-authored
// landing HTML, so pages with an empty `description` field still get real copy.
function extractBodyDescription(body = '') {
  const paras = String(body).match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi) || [];
  for (const p of paras) {
    const text = stripTags(p);
    if (text.length >= 40) return text.slice(0, 300);
  }
  return '';
}

// FAQPage rich result: parse <details><summary>Q</summary>A</details> blocks
// out of the admin-authored HTML (the gem's standard FAQ pattern).
function extractFaqs(body = '') {
  const out: { question: string; answer: string }[] = [];
  const blocks = String(body).match(/<details\b[^>]*>([\s\S]*?)<\/details\s*>/gi) || [];
  for (const block of blocks) {
    const sumMatch = block.match(/<summary\b[^>]*>([\s\S]*?)<\/summary\s*>/i);
    if (!sumMatch) continue;
    const question = stripTags(sumMatch[1]);
    const answer = stripTags(block.replace(/<summary\b[^>]*>[\s\S]*?<\/summary\s*>/i, ''));
    if (question && answer) out.push({ question, answer: answer.slice(0, 500) });
  }
  return out;
}

async function getSeries(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/test-series/public/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeries(slug);
  if (!series) return { title: 'Test Series not found' };

  const description =
    series.description ||
    extractBodyDescription(series.body) ||
    `Practice with the ${series.title} mock test series on ExamOS — full-length CBT tests with detailed analytics.`;

  return {
    title: series.title,
    description,
    keywords: Array.isArray(series.tags) ? series.tags : undefined,
    openGraph: {
      title: series.title,
      description,
      type: 'website',
      url: `${SITE_URL}/explore/${series.slug || slug}`,
      images: series.banner ? [{ url: series.banner }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: series.title,
      description,
    },
    alternates: { canonical: `/explore/${series.slug || slug}` },
  };
}

function buildSeriesJsonLd(series: any, slug: string) {
  const url = `${SITE_URL}/explore/${encodeURIComponent(series.slug || slug)}`;
  const price = Number(series.price) || 0;
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Test Series', item: `${SITE_URL}/explore` },
        { '@type': 'ListItem', position: 3, name: series.title, item: url },
      ],
    },
    {
      '@type': 'Product',
      name: series.title,
      description: series.description || extractBodyDescription(series.body) || undefined,
      image: series.banner || undefined,
      category: series.examId?.name || undefined,
      brand: { '@type': 'Organization', name: 'ExamOS', url: SITE_URL },
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'INR',
        price: price.toFixed(2),
        availability: 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: 'ExamOS', url: SITE_URL },
      },
    },
  ];

  // FAQ rich results straight from the landing HTML's <details> blocks.
  const faqs = extractFaqs(series.body || '');
  if (faqs.length >= 2) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export default async function ExploreDetailPage({ params }: Props) {
  const { slug } = await params;
  const series = await getSeries(slug);
  if (!series) notFound();

  const jsonLd = buildSeriesJsonLd(series, slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <SeriesDetailClient series={series} />
    </>
  );
}
