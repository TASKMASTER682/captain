'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function RefundCancellationPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 border-b border-border pb-6">
          <div className="flex-shrink-0">
            <img src="/logo.png" alt="ExamOS" className="w-12 h-12 rounded-xl shadow-md shadow-primary/20 object-cover" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-outfit text-primary">Refund & Cancellation Policy</h1>
            <p className="text-sm text-muted-foreground">Last Updated: August 2026</p>
          </div>
        </div>

        {/* Digital Product Access */}
        <div className="bg-muted/5 border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold font-outfit text-primary mb-4">1. Digital Product Access</h2>
          <p className="text-muted-foreground">
            ExamOS provides instant digital access to mock tests, CBT practice engines, analytics dashboards, and study materials upon subscription purchase.
          </p>
        </div>

        {/* Refund Eligibility */}
        <div className="bg-muted/5 border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold font-outfit text-primary mb-4">2. Refund Eligibility</h2>
          <p className="text-muted-foreground">
            Due to the instant delivery nature of digital content, subscription plans (Monthly/Annual Premium) are generally non-refundable once activated.
          </p>
          <p className="text-muted-foreground font-medium mt-3">Refunds may be considered only if:</p>
          <ul className="text-muted-foreground space-y-1 pl-4">
            <li>A double payment occurred due to a technical payment gateway glitch.</li>
            <li>Access to the platform was completely inaccessible due to server outages lasting more than 72 consecutive hours.</li>
          </ul>
        </div>

        {/* Cancellation */}
        <div className="bg-muted/5 border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold font-outfit text-primary mb-4">3. Subscription Cancellation</h2>
          <p className="text-muted-foreground">
            ExamOS operates on a prepaid subscription model. Once a subscription plan (Monthly/Annual Premium) is activated, access continues for the full billing cycle. You may cancel auto-renewal at any time from your Account Dashboard to prevent charges for the next cycle, but no mid-cycle refunds or prorated amounts are provided due to the instant digital delivery nature of the content.
          </p>
        </div>

        {/* Back link */}
        <div className="mt-8 pt-8 border-t border-border">
          <a 
            href="/test-series" 
            className="text-primary hover:text-primary/90 transition-colors"
          >
            ← Back to Test Series
          </a>
        </div>
      </div>
    </div>
  );
}