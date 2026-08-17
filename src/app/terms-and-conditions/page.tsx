'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 border-b border-border pb-6">
          <div className="flex-shrink-0">
            <img src="/logo.png" alt="ExamOS" className="w-12 h-12 rounded-xl shadow-md shadow-primary/20 object-cover" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-outfit text-primary">Terms & Conditions</h1>
            <p className="text-sm text-muted-foreground">Last Updated: August 2026</p>
          </div>
        </div>

        {/* User Accounts */}
        <div className="bg-muted/5 border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold font-outfit text-primary mb-4">1. User Accounts</h2>
          <ul className="text-muted-foreground space-y-2">
            <li>
              You are responsible for maintaining the confidentiality of your account credentials.
            </li>
            <li>
              Account sharing, unauthorized distribution of practice content, or simultaneous logins across unauthorized devices are strictly prohibited.
            </li>
          </ul>
        </div>

        {/* Intellectual Property */}
        <div className="bg-muted/5 border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold font-outfit text-primary mb-4">2. Intellectual Property</h2>
          <ul className="text-muted-foreground space-y-2">
            <li>
              The ExamOS CBT Engine v2.3, software code, UI design, analytics algorithms, question databases, and proprietary study material are the exclusive intellectual property of ExamOS Inc.
            </li>
            <li>
              You may not copy, scrape, reverse-engineer, re-sell, or distribute any content from ExamOS without explicit written permission.
            </li>
          </ul>
        </div>

        {/* Platform Usage & Security */}
        <div className="bg-muted/5 border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold font-outfit text-primary mb-4">3. Platform Usage & Security</h2>
          <ul className="text-muted-foreground space-y-2">
            <li>
              ExamOS features lockdown exam security modes (fullscreen enforcement, section locking, auto-save). Attempting to bypass, hack, or exploit these security mechanisms will result in immediate account termination without refund.
            </li>
          </ul>
        </div>

        {/* AI Doubt Solver & Community Content */}
        <div className="bg-muted/5 border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold font-outfit text-primary mb-4">4. AI Doubt Solver & Community Content</h2>
          <ul className="text-muted-foreground space-y-2">
            <li>
              AI-generated solutions are provided for guidance. While we strive for high accuracy, users should cross-verify complex solutions.
            </li>
            <li>
              Abusive, spammy, or illicit behavior in community threads or doubt forums will lead to a permanent ban.
            </li>
          </ul>
        </div>

        {/* Modifications to Service */}
        <div className="bg-muted/5 border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold font-outfit text-primary mb-4">5. Modifications to Service</h2>
          <p className="text-muted-foreground">
            ExamOS reserves the right to update, modify, or discontinue features, test series, or subscription plans with prior notice.
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