'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, setAuthToken, getAuthUser } from '@/lib/api';
import {
  CheckCircle,
  XCircle,
  Mail,
  GraduationCap,
  Search,
  Check,
  Building2,
  X,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please check the link in your email.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        if (res.success) {
          setAuthToken(res.data.token, res.data.user);
          setStatus('success');
          setTimeout(() => router.push('/dashboard'), 2000);
        } else {
          setStatus('error');
          setMessage(res.message || 'Verification failed.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Verification failed. The link may have expired.');
      }
    };

    verify();
  }, [token]);



  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 transition-colors duration-300 font-sans">
      <Link
        href="/login"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Back to login
      </Link>

      <div className="w-full max-w-md">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="p-8 rounded-3xl border border-border bg-card shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h1 className="text-xl font-bold font-outfit mb-2">Verifying your email...</h1>
            <p className="text-sm text-muted-foreground">Please wait while we verify your email address.</p>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="p-8 rounded-3xl border border-border bg-card shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-xl font-bold font-outfit mb-2">Verification Failed</h1>
            <p className="text-sm text-muted-foreground mb-6">{message}</p>
            <Link
              href="/login"
              className="inline-block w-full py-3.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/95 transition-all text-sm shadow-lg shadow-primary/25 text-center"
            >
              Go to Login
            </Link>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="p-8 rounded-3xl border border-border bg-card shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold font-outfit mb-2">Email Verified!</h1>
            <p className="text-sm text-muted-foreground mb-6">Your account is ready. Redirecting you to dashboard...</p>
            <Link
              href="/dashboard"
              className="inline-block w-full py-3.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/95 transition-all text-sm shadow-lg shadow-primary/25 text-center"
            >
              Go to Dashboard Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
