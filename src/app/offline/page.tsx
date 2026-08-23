import type { Metadata } from 'next';
import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'You are offline',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex-1 flex items-center justify-center px-4 font-sans">
      <div className="max-w-md w-full text-center p-8 rounded-3xl border border-border bg-card shadow-sm">
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-black font-outfit mb-2">You&apos;re offline</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          ExamOS couldn&apos;t reach the internet. Check your connection and try
          again — your data is safe and nothing was lost.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/95 transition-colors shadow-md shadow-primary/20"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
