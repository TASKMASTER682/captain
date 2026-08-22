'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { ArrowLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { getAuthUser } from '@/lib/api';

export default function RazorpaySettings() {
  const [user, setUser] = useState<any>(null);

  return (
    <AdminLayout user={user}>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-6">
            <p className="text-sm font-semibold text-foreground">
              Razorpay keys are now configured via environment variables.
            </p>
            <p className="text-sm text-muted-foreground mt-1.5">
              Add <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">RAZORPAY_KEY_ID</code> and <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">RAZORPAY_KEY_SECRET</code> to <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">backend/.env</code>
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-sm font-outfit">How It Works</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Without keys: Payments use <strong>offline mode</strong> (auto-verify for testing)</li>
              <li>With Test keys: Real Razorpay checkout in test mode (no real money)</li>
              <li>With Live keys: Real payments in production</li>
              <li>Key secret never reaches the frontend</li>
            </ul>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}