import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Test Series | ExamOS',
  description:
    'Browse full-length CBT mock test series for SSC, JKSSB, banking and other government exams. Compare prices, see what’s inside each series and start practising on ExamOS.',
  alternates: { canonical: '/explore' },
  openGraph: {
    title: 'Explore Test Series | ExamOS',
    description:
      'Browse full-length CBT mock test series for SSC, JKSSB, banking and other government exams. Compare prices, see what’s inside each series and start practising.',
    type: 'website',
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
