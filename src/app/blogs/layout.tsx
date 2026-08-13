import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blogs & Articles | ExamOS',
  description:
    'Read the latest exam tips, preparation strategies, study notes, and subject articles curated by the ExamOS team.',
  alternates: { canonical: '/blogs' },
  openGraph: {
    title: 'Blogs & Articles | ExamOS',
    description:
      'Read the latest exam tips, preparation strategies, study notes, and subject articles curated by the ExamOS team.',
    type: 'website',
  },
};

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return children;
}