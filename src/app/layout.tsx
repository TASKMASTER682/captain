import type { Metadata, Viewport } from 'next';
import { Inter, Outfit, Playfair_Display } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ReactQueryProvider } from '@/components/ReactQueryProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorReporter from '@/components/ErrorReporter';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import PWARegister from '@/components/PWARegister';
import InstallPrompt from '@/components/InstallPrompt';
import { SITE_URL } from '@/lib/config';
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

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  // Only blogs pages use this font — don't preload it on every page load.
  preload: false,
});

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: {
    default: 'ExamOS - Premium Computer-Based Test (CBT) Operating System',
    template: '%s | ExamOS',
  },
  description: 'Enterprise-grade assessment operating system for competitive exams. Speed analytics, recommendation engine, spaced repetition revision, and original government-standard CBT engine.',
  keywords: ['CBT', 'competitive exams', 'online test series', 'exam preparation', 'mock tests', 'ExamOS'],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ExamOS',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    siteName: 'ExamOS',
    title: 'ExamOS - Premium CBT Operating System for Competitive Exams',
    description: 'Enterprise-grade assessment operating system for competitive exams. Speed analytics, recommendation engine, spaced repetition revision, and original government-standard CBT engine.',
    images: [{ url: '/logo.png', alt: 'ExamOS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExamOS - Premium CBT Operating System for Competitive Exams',
    description: 'Enterprise-grade assessment operating system for competitive exams.',
    images: ['/logo.png'],
  },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7552E0' },
    { media: '(prefers-color-scheme: dark)', color: '#7552E0' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${playfair.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col background text-foreground">
        <ErrorBoundary>
          <ReactQueryProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </ReactQueryProvider>
        </ErrorBoundary>
        <PWARegister />
        <InstallPrompt />
        <ErrorReporter />
        <AnalyticsTracker />
      </body>
    </html>
  );
}
