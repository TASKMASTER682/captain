'use client';
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestBuilderRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/test-series'); }, [router]);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
    </div>
  );
}
