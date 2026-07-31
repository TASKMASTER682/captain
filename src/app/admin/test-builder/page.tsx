'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestBuilderRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/test-series'); }, [router]);
  return <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">Redirecting to Test Series...</div>;
}
