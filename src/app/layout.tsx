import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ReactQueryProvider } from '@/components/ReactQueryProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ExamOS - Premium Computer-Based Test (CBT) Operating System',
  description: 'Enterprise-grade assessment operating system for competitive exams. Speed analytics, recommendation engine, spaced repetition revision, and original government-standard CBT engine.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col background text-foreground">
        <ReactQueryProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
